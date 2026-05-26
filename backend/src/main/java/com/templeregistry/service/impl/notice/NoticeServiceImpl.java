package com.templeregistry.service.impl.notice;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.notice.ChangeNoticeStatusRequest;
import com.templeregistry.dto.request.notice.CreateNoticeRequest;
import com.templeregistry.dto.request.notice.NoticeListFilter;
import com.templeregistry.dto.request.notice.UpdateNoticeRequest;
import com.templeregistry.dto.response.notice.NoticeAttachmentResponse;
import com.templeregistry.dto.response.notice.NoticeListItemResponse;
import com.templeregistry.dto.response.notice.NoticeResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.notice.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.notice.NoticeMapper;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.notice.NoticeAttachmentRepository;
import com.templeregistry.repository.notice.NoticeReadRepository;
import com.templeregistry.repository.notice.NoticeRepository;
import com.templeregistry.repository.notice.NoticeSpecification;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.service.notice.NoticeService;
import com.templeregistry.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoticeServiceImpl implements NoticeService {

    private static final int DASHBOARD_NOTICE_LIMIT = 5;
    private static final long MAX_ATTACHMENT_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final int MAX_ATTACHMENTS_PER_NOTICE = 5;
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf", "image/png", "image/jpeg", "image/gif"
    );

    private final NoticeRepository noticeRepository;
    private final NoticeAttachmentRepository attachmentRepository;
    private final NoticeReadRepository noticeReadRepository;
    private final NoticeMapper noticeMapper;
    private final UserRepository userRepository;
    private final DistrictRepository districtRepository;
    private final TempleRepository templeRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    // ── Create ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public NoticeResponse createNotice(CreateNoticeRequest request, ScopeHelper.Claims claims) {
        validateCreateRequest(request, claims);

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .body(request.getBody())
                .scope(request.getScope())
                .districtId(resolveDistrictId(request, claims))
                .status(resolveInitialStatus(request.getStatus()))
                .priority(request.getPriority())
                .pinned(request.isPinned())
                .expiryDate(request.getExpiryDate())
                .build();

        if (notice.getStatus() == NoticeStatus.PUBLISHED) {
            notice.setPublishedAt(LocalDateTime.now());
        }

        Notice saved = noticeRepository.save(notice);

        if (saved.getStatus() == NoticeStatus.PUBLISHED) {
            fanOutNotifications(saved, claims);
        }

        return buildResponse(saved, claims.userId());
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public NoticeResponse updateNotice(Long id, UpdateNoticeRequest request, ScopeHelper.Claims claims) {
        Notice notice = findAndAssertAccess(id, claims);
        assertNotTerminal(notice);

        if (request.getTitle() != null) notice.setTitle(request.getTitle());
        if (request.getBody() != null) notice.setBody(request.getBody());
        if (request.getPriority() != null) notice.setPriority(request.getPriority());
        if (request.getPinned() != null) notice.setPinned(request.getPinned());
        if (request.getExpiryDate() != null) notice.setExpiryDate(request.getExpiryDate());

        if (request.getStatus() != null) {
            applyStatusTransition(notice, request.getStatus(), claims);
        }

        return buildResponse(noticeRepository.save(notice), claims.userId());
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void deleteNotice(Long id, ScopeHelper.Claims claims) {
        Notice notice = findAndAssertAccess(id, claims);
        noticeRepository.delete(notice); // triggers @SQLDelete soft-delete
    }

    // ── Status change ────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public NoticeResponse changeStatus(Long id, ChangeNoticeStatusRequest request, ScopeHelper.Claims claims) {
        Notice notice = findAndAssertAccess(id, claims);
        applyStatusTransition(notice, request.getTargetStatus(), claims);
        return buildResponse(noticeRepository.save(notice), claims.userId());
    }

    // ── Get by ID ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public NoticeResponse getById(Long id, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findWithAttachmentsById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + id, "NOTICE_NOT_FOUND"));

        assertVisibility(notice, claims);
        markAsRead(id, claims.userId());

        return buildResponse(notice, claims.userId());
    }

    // ── DC list ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public PaginatedResponse<NoticeListItemResponse> listForDc(NoticeListFilter filter, Pageable pageable,
                                                                ScopeHelper.Claims claims) {
        Long districtId = claims.role().equals(RoleConstants.SUPER_ADMIN)
                ? filter.getDistrictId()
                : claims.districtId();

        Page<Notice> page = noticeRepository.findAll(
                NoticeSpecification.forDistrictManager(districtId, filter.getStatus(), filter.getPriority(), filter.getSearch()),
                pageable);

        return PaginatedResponse.of(enrichPage(page, claims.userId()));
    }

    // ── Admin list ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public PaginatedResponse<NoticeListItemResponse> listForAdmin(NoticeListFilter filter, Pageable pageable) {
        Page<Notice> page = noticeRepository.findAll(
                NoticeSpecification.forAdmin(filter.getDistrictId(), filter.getScope(),
                        filter.getStatus(), filter.getPriority(), filter.getSearch()),
                pageable);

        return PaginatedResponse.of(enrichPage(page, null));
    }

    // ── TA dashboard feed ────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public List<NoticeListItemResponse> listForTaDashboard(ScopeHelper.Claims claims) {
        Long districtId = resolveDistrictIdForTa(claims);
        Pageable limit = PageRequest.of(0, DASHBOARD_NOTICE_LIMIT);
        List<Notice> notices = noticeRepository.findDashboardNotices(districtId, limit);

        Set<Long> readIds = noticeReadRepository.findReadNoticeIds(
                claims.userId(),
                notices.stream().map(Notice::getId).collect(Collectors.toList()));

        return notices.stream().map(n -> {
            NoticeListItemResponse item = noticeMapper.toListItemResponse(n);
            item.setAttachmentCount(n.getAttachments().size());
            item.setRead(readIds.contains(n.getId()));
            enrichDistrictName(item, n.getDistrictId());
            enrichCreatedByName(item, n.getCreatedBy());
            return item;
        }).collect(Collectors.toList());
    }

    // ── Attachments ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public NoticeResponse addAttachment(Long noticeId, MultipartFile file, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findWithAttachmentsById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + noticeId, "NOTICE_NOT_FOUND"));

        assertOwnerOrAdmin(notice, claims);
        assertNotTerminal(notice);

        if (notice.getAttachments().size() >= MAX_ATTACHMENTS_PER_NOTICE) {
            throw new IllegalStateException("Maximum of " + MAX_ATTACHMENTS_PER_NOTICE + " attachments allowed per notice.");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds maximum allowed size of 10 MB.");
        }
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("File type not allowed. Permitted types: PDF, PNG, JPEG, GIF.");
        }

        String storedKey = fileStorageService.upload("notices/" + noticeId, file);

        NoticeAttachment attachment = NoticeAttachment.builder()
                .notice(notice)
                .originalFilename(file.getOriginalFilename())
                .storedKey(storedKey)
                .fileSizeBytes(file.getSize())
                .mimeType(mimeType)
                .build();

        notice.getAttachments().add(attachment);
        return buildResponse(noticeRepository.save(notice), claims.userId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void removeAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findWithAttachmentsById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + noticeId, "NOTICE_NOT_FOUND"));

        assertOwnerOrAdmin(notice, claims);

        NoticeAttachment attachment = notice.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + attachmentId, "NOTICE_ATTACHMENT_NOT_FOUND"));

        notice.getAttachments().remove(attachment);
        noticeRepository.save(notice);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public Resource downloadAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims) {
        return loadAttachmentResource(noticeId, attachmentId, claims);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public Resource previewAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims) {
        return loadAttachmentResource(noticeId, attachmentId, claims);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public String getAttachmentMimeType(Long noticeId, Long attachmentId, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findWithAttachmentsById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + noticeId, "NOTICE_NOT_FOUND"));
        assertVisibility(notice, claims);
        return notice.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .map(NoticeAttachment::getMimeType)
                .findFirst()
                .orElse("application/octet-stream");
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private Resource loadAttachmentResource(Long noticeId, Long attachmentId, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findWithAttachmentsById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + noticeId, "NOTICE_NOT_FOUND"));

        assertVisibility(notice, claims);

        NoticeAttachment attachment = notice.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + attachmentId, "NOTICE_ATTACHMENT_NOT_FOUND"));

        return fileStorageService.loadAsResource(attachment.getStoredKey());
    }

    private void validateCreateRequest(CreateNoticeRequest request, ScopeHelper.Claims claims) {
        if (request.getScope() == NoticeScope.GLOBAL && !claims.role().equals(RoleConstants.SUPER_ADMIN)) {
            throw new AccessDeniedException("Only SUPER_ADMIN can create GLOBAL notices.");
        }
        if (request.getStatus() == NoticeStatus.ARCHIVED || request.getStatus() == NoticeStatus.EXPIRED) {
            throw new IllegalArgumentException("Cannot create a notice with status ARCHIVED or EXPIRED.");
        }
    }

    private Long resolveDistrictId(CreateNoticeRequest request, ScopeHelper.Claims claims) {
        if (request.getScope() == NoticeScope.GLOBAL) {
            return null;
        }
        // DC: always use their own districtId from JWT — never trust the request body
        if (claims.role().equals(RoleConstants.DISTRICT_COLLECTOR)) {
            return claims.districtId();
        }
        // SA: can create for any district — but a districtId must be provided in this case
        if (claims.districtId() != null) {
            return claims.districtId();
        }
        throw new IllegalArgumentException("districtId is required for DISTRICT-scoped notices.");
    }

    private NoticeStatus resolveInitialStatus(NoticeStatus requested) {
        if (requested == NoticeStatus.DRAFT || requested == NoticeStatus.PUBLISHED) {
            return requested;
        }
        return NoticeStatus.PUBLISHED;
    }

    private Notice findAndAssertAccess(Long id, ScopeHelper.Claims claims) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notice not found: " + id, "NOTICE_NOT_FOUND"));
        assertOwnerOrAdmin(notice, claims);
        return notice;
    }

    private void assertOwnerOrAdmin(Notice notice, ScopeHelper.Claims claims) {
        boolean isAdmin = claims.role().equals(RoleConstants.SUPER_ADMIN);
        boolean isOwner = notice.getCreatedBy() != null && notice.getCreatedBy().equals(claims.userId());
        boolean isSameDistrict = notice.getDistrictId() != null
                && notice.getDistrictId().equals(claims.districtId());

        if (!isAdmin && !isOwner && !isSameDistrict) {
            throw new AccessDeniedException("You do not have permission to modify this notice.");
        }
    }

    private void assertVisibility(Notice notice, ScopeHelper.Claims claims) {
        String role = claims.role();
        if (role.equals(RoleConstants.SUPER_ADMIN)) return;

        if (notice.getScope() == NoticeScope.GLOBAL) return;

        // DC: must match district
        if (role.equals(RoleConstants.DISTRICT_COLLECTOR)) {
            if (!notice.getDistrictId().equals(claims.districtId())) {
                throw new AccessDeniedException("Notice does not belong to your district.");
            }
            return;
        }

        // TA: resolve their district via temple
        if (role.equals(RoleConstants.TEMPLE_AUTHORITY)) {
            Long taDistrictId = resolveDistrictIdForTa(claims);
            if (!notice.getDistrictId().equals(taDistrictId)) {
                throw new AccessDeniedException("Notice does not belong to your district.");
            }
        }
    }

    private void assertNotTerminal(Notice notice) {
        if (notice.getStatus().isTerminal()) {
            throw new IllegalStateException("Cannot modify an EXPIRED notice.");
        }
    }

    private void applyStatusTransition(Notice notice, NoticeStatus target, ScopeHelper.Claims claims) {
        if (notice.getStatus().isTerminal()) {
            throw new IllegalStateException("Cannot change status of an EXPIRED notice.");
        }
        if (target == NoticeStatus.EXPIRED) {
            throw new IllegalArgumentException("EXPIRED status is set by the system scheduler only.");
        }
        if (target == NoticeStatus.PUBLISHED && notice.getStatus() != NoticeStatus.PUBLISHED) {
            notice.setPublishedAt(LocalDateTime.now());
            fanOutNotifications(notice, claims);
        }
        notice.setStatus(target);
    }

    private void markAsRead(Long noticeId, Long userId) {
        try {
            if (noticeReadRepository.findByNoticeIdAndUserId(noticeId, userId).isEmpty()) {
                NoticeRead read = NoticeRead.builder()
                        .noticeId(noticeId)
                        .userId(userId)
                        .readAt(LocalDateTime.now())
                        .build();
                noticeReadRepository.save(read);
            }
        } catch (DataIntegrityViolationException ex) {
            // Concurrent read — unique constraint fired; ignore, it is still "read"
            log.debug("Concurrent notice-read insert ignored for notice={} user={}", noticeId, userId);
        }
    }

    private Long resolveDistrictIdForTa(ScopeHelper.Claims claims) {
        if (claims.districtId() != null) return claims.districtId();
        // Fallback: look up via temple
        return templeRepository.findById(claims.templeId())
                .map(t -> t.getDistrictId())
                .orElseThrow(() -> new EntityNotFoundException("Temple not found for TA user.", "TEMPLE_NOT_FOUND"));
    }

    @Async
    protected void fanOutNotifications(Notice notice, ScopeHelper.Claims claims) {
        try {
            List<Long> recipientIds;
            if (notice.getScope() == NoticeScope.GLOBAL) {
                recipientIds = userRepository.findAllByRole(com.templeregistry.entity.auth.UserRole.TEMPLE_AUTHORITY)
                        .stream().map(u -> u.getId()).collect(Collectors.toList());
            } else {
                recipientIds = userRepository.findAllByRoleAndDistrictId(
                                com.templeregistry.entity.auth.UserRole.TEMPLE_AUTHORITY, notice.getDistrictId())
                        .stream().map(u -> u.getId()).collect(Collectors.toList());
            }

            String title = "New Notice: " + notice.getTitle();
            String body = notice.getScope() == NoticeScope.GLOBAL
                    ? "A new notice has been published for all temples."
                    : "A new notice has been published for your district.";

            for (Long recipientId : recipientIds) {
                notificationService.notify(recipientId, title, body, "NOTICE", notice.getId());
            }
            log.info("Notice {} fan-out sent to {} TA users", notice.getId(), recipientIds.size());
        } catch (Exception ex) {
            log.error("Async notification fan-out failed for notice {}: {}", notice.getId(), ex.getMessage(), ex);
        }
    }

    private NoticeResponse buildResponse(Notice notice, Long currentUserId) {
        NoticeResponse response = noticeMapper.toResponse(notice);

        enrichDistrictName(response, notice.getDistrictId());
        enrichCreatedByName(response, notice.getCreatedBy());

        if (currentUserId != null) {
            boolean isRead = noticeReadRepository.findByNoticeIdAndUserId(notice.getId(), currentUserId).isPresent();
            response.setRead(isRead);
        }

        List<NoticeAttachmentResponse> attachmentResponses = notice.getAttachments().stream()
                .map(a -> {
                    NoticeAttachmentResponse ar = noticeMapper.toAttachmentResponse(a);
                    ar.setDownloadUrl("/api/v1/notices/" + notice.getId() + "/attachments/" + a.getId() + "/download");
                    ar.setPreviewUrl("/api/v1/notices/" + notice.getId() + "/attachments/" + a.getId() + "/preview");
                    return ar;
                }).collect(Collectors.toList());
        response.setAttachments(attachmentResponses);

        return response;
    }

    private Page<NoticeListItemResponse> enrichPage(Page<Notice> page, Long currentUserId) {
        List<Long> ids = page.getContent().stream().map(Notice::getId).collect(Collectors.toList());
        Set<Long> readIds = currentUserId != null
                ? noticeReadRepository.findReadNoticeIds(currentUserId, ids)
                : Set.of();

        return page.map(n -> {
            NoticeListItemResponse item = noticeMapper.toListItemResponse(n);
            item.setAttachmentCount(n.getAttachments().size());
            item.setRead(readIds.contains(n.getId()));
            enrichDistrictName(item, n.getDistrictId());
            enrichCreatedByName(item, n.getCreatedBy());
            return item;
        });
    }

    private void enrichDistrictName(Object response, Long districtId) {
        if (districtId == null) return;
        String name = districtRepository.findById(districtId).map(d -> d.getName()).orElse(null);
        if (response instanceof NoticeResponse r) r.setDistrictName(name);
        else if (response instanceof NoticeListItemResponse r) r.setDistrictName(name);
    }

    private void enrichCreatedByName(Object response, Long createdBy) {
        if (createdBy == null) return;
        String name = userRepository.findById(createdBy).map(u -> u.getFullName()).orElse(null);
        if (response instanceof NoticeResponse r) r.setCreatedByName(name);
        else if (response instanceof NoticeListItemResponse r) r.setCreatedByName(name);
    }
}
