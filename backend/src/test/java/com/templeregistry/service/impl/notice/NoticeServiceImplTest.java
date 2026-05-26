package com.templeregistry.service.impl.notice;

import com.templeregistry.dto.request.notice.ChangeNoticeStatusRequest;
import com.templeregistry.dto.request.notice.CreateNoticeRequest;
import com.templeregistry.dto.response.notice.NoticeListItemResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.notice.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.notice.NoticeMapper;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.notice.NoticeAttachmentRepository;
import com.templeregistry.repository.notice.NoticeReadRepository;
import com.templeregistry.repository.notice.NoticeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.service.notice.NoticeExpiryScheduler;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NoticeServiceImpl.
 * @PreAuthorize annotations are not enforced here — business logic guards are tested directly.
 */
@ExtendWith(MockitoExtension.class)
class NoticeServiceImplTest {

    @Mock NoticeRepository noticeRepository;
    @Mock NoticeAttachmentRepository attachmentRepository;
    @Mock NoticeReadRepository noticeReadRepository;
    @Mock NoticeMapper noticeMapper;
    @Mock UserRepository userRepository;
    @Mock DistrictRepository districtRepository;
    @Mock TempleRepository templeRepository;
    @Mock FileStorageService fileStorageService;
    @Mock NotificationService notificationService;

    @InjectMocks NoticeServiceImpl noticeService;

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static ScopeHelper.Claims dcClaims(Long districtId) {
        return new ScopeHelper.Claims(10L, RoleConstants.DISTRICT_COLLECTOR, districtId, null, "dc_user", null);
    }

    private static ScopeHelper.Claims saClaims() {
        return new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user", null);
    }

    private static ScopeHelper.Claims taClaims(Long templeId) {
        return new ScopeHelper.Claims(20L, RoleConstants.TEMPLE_AUTHORITY, null, templeId, "ta_user", null);
    }

    private Notice publishedDistrictNotice(Long districtId) {
        Notice n = new Notice();
        n.setId(100L);
        n.setTitle("Test Notice");
        n.setBody("Test body content here");
        n.setScope(NoticeScope.DISTRICT);
        n.setDistrictId(districtId);
        n.setStatus(NoticeStatus.PUBLISHED);
        n.setPriority(NoticePriority.MEDIUM);
        n.setCreatedBy(10L);
        return n;
    }

    private CreateNoticeRequest districtCreateRequest() {
        CreateNoticeRequest req = new CreateNoticeRequest();
        req.setTitle("District Notice");
        req.setBody("Notice body content here, minimum 10 chars.");
        req.setScope(NoticeScope.DISTRICT);
        req.setPriority(NoticePriority.MEDIUM);
        req.setStatus(NoticeStatus.PUBLISHED);
        return req;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Nested
    class CreateNotice {

        @Test
        void should_create_district_notice_when_dc_with_valid_claims() {
            ScopeHelper.Claims claims = dcClaims(7L);
            CreateNoticeRequest req = districtCreateRequest();

            Notice saved = publishedDistrictNotice(7L);
            when(noticeRepository.save(any())).thenReturn(saved);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(noticeReadRepository.findByNoticeIdAndUserId(any(), any())).thenReturn(Optional.empty());
            when(districtRepository.findById(7L)).thenReturn(Optional.of(new District()));
            when(userRepository.findById(10L)).thenReturn(Optional.of(new User()));

            assertThatNoException().isThrownBy(() -> noticeService.createNotice(req, claims));
            verify(noticeRepository).save(argThat(n -> n.getDistrictId().equals(7L)));
        }

        @Test
        void should_throw_access_denied_when_dc_creates_global_notice() {
            ScopeHelper.Claims claims = dcClaims(7L);
            CreateNoticeRequest req = districtCreateRequest();
            req.setScope(NoticeScope.GLOBAL);

            assertThatThrownBy(() -> noticeService.createNotice(req, claims))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("SUPER_ADMIN");
        }

        @Test
        void should_create_global_notice_when_super_admin() {
            ScopeHelper.Claims claims = saClaims();
            CreateNoticeRequest req = districtCreateRequest();
            req.setScope(NoticeScope.GLOBAL);

            Notice saved = new Notice();
            saved.setId(200L);
            saved.setScope(NoticeScope.GLOBAL);
            saved.setStatus(NoticeStatus.PUBLISHED);
            when(noticeRepository.save(any())).thenReturn(saved);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(noticeReadRepository.findByNoticeIdAndUserId(any(), any())).thenReturn(Optional.empty());

            assertThatNoException().isThrownBy(() -> noticeService.createNotice(req, claims));
            verify(noticeRepository).save(argThat(n -> n.getScope() == NoticeScope.GLOBAL && n.getDistrictId() == null));
        }

        @Test
        void should_throw_illegal_argument_when_status_is_archived_on_create() {
            ScopeHelper.Claims claims = dcClaims(7L);
            CreateNoticeRequest req = districtCreateRequest();
            req.setStatus(NoticeStatus.ARCHIVED);

            assertThatThrownBy(() -> noticeService.createNotice(req, claims))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void should_set_published_at_when_status_is_published_on_create() {
            ScopeHelper.Claims claims = dcClaims(7L);
            CreateNoticeRequest req = districtCreateRequest();
            req.setStatus(NoticeStatus.PUBLISHED);

            Notice saved = publishedDistrictNotice(7L);
            when(noticeRepository.save(any())).thenReturn(saved);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(noticeReadRepository.findByNoticeIdAndUserId(any(), any())).thenReturn(Optional.empty());
            when(districtRepository.findById(7L)).thenReturn(Optional.of(new District()));
            when(userRepository.findById(any())).thenReturn(Optional.of(new User()));

            noticeService.createNotice(req, claims);

            verify(noticeRepository).save(argThat(n -> n.getPublishedAt() != null));
        }
    }

    // ── Ownership ─────────────────────────────────────────────────────────────

    @Nested
    class Ownership {

        @Test
        void should_throw_access_denied_when_dc_modifies_another_districts_notice() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(99L); // different district
            notice.setCreatedBy(99L); // different user — not the requesting DC
            when(noticeRepository.findById(100L)).thenReturn(Optional.of(notice));

            assertThatThrownBy(() -> noticeService.deleteNotice(100L, claims))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void should_allow_sa_to_delete_any_notice() {
            ScopeHelper.Claims claims = saClaims();
            Notice notice = publishedDistrictNotice(99L);
            when(noticeRepository.findById(100L)).thenReturn(Optional.of(notice));

            assertThatNoException().isThrownBy(() -> noticeService.deleteNotice(100L, claims));
            verify(noticeRepository).delete(notice);
        }
    }

    // ── Status transitions ────────────────────────────────────────────────────

    @Nested
    class StatusTransitions {

        @Test
        void should_reject_status_transition_when_notice_is_expired() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(7L);
            notice.setStatus(NoticeStatus.EXPIRED);
            when(noticeRepository.findById(100L)).thenReturn(Optional.of(notice));

            ChangeNoticeStatusRequest req = new ChangeNoticeStatusRequest();
            req.setTargetStatus(NoticeStatus.PUBLISHED);

            assertThatThrownBy(() -> noticeService.changeStatus(100L, req, claims))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("EXPIRED");
        }

        @Test
        void should_reject_setting_expired_status_manually() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(7L);
            when(noticeRepository.findById(100L)).thenReturn(Optional.of(notice));

            ChangeNoticeStatusRequest req = new ChangeNoticeStatusRequest();
            req.setTargetStatus(NoticeStatus.EXPIRED);

            assertThatThrownBy(() -> noticeService.changeStatus(100L, req, claims))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void should_archive_published_notice_when_valid_dc() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(7L);
            when(noticeRepository.findById(100L)).thenReturn(Optional.of(notice));
            when(noticeRepository.save(any())).thenReturn(notice);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(noticeReadRepository.findByNoticeIdAndUserId(any(), any())).thenReturn(Optional.empty());
            when(districtRepository.findById(any())).thenReturn(Optional.of(new District()));
            when(userRepository.findById(any())).thenReturn(Optional.of(new User()));

            ChangeNoticeStatusRequest req = new ChangeNoticeStatusRequest();
            req.setTargetStatus(NoticeStatus.ARCHIVED);

            assertThatNoException().isThrownBy(() -> noticeService.changeStatus(100L, req, claims));
            assertThat(notice.getStatus()).isEqualTo(NoticeStatus.ARCHIVED);
        }
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    @Nested
    class Visibility {

        @Test
        void should_throw_access_denied_when_ta_reads_notice_from_different_district() {
            ScopeHelper.Claims claims = taClaims(5L);
            Notice notice = publishedDistrictNotice(99L); // district 99
            when(noticeRepository.findWithAttachmentsById(100L)).thenReturn(Optional.of(notice));
            when(templeRepository.findById(5L)).thenReturn(Optional.of(templeWithDistrict(7L)));

            assertThatThrownBy(() -> noticeService.getById(100L, claims))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void should_return_notice_when_ta_reads_notice_from_same_district() {
            ScopeHelper.Claims claims = taClaims(5L);
            Notice notice = publishedDistrictNotice(7L); // district 7
            when(noticeRepository.findWithAttachmentsById(100L)).thenReturn(Optional.of(notice));
            when(templeRepository.findById(5L)).thenReturn(Optional.of(templeWithDistrict(7L)));
            when(noticeReadRepository.findByNoticeIdAndUserId(any(), any())).thenReturn(Optional.empty());
            when(noticeReadRepository.save(any())).thenReturn(null);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(districtRepository.findById(any())).thenReturn(Optional.of(new District()));
            when(userRepository.findById(any())).thenReturn(Optional.of(new User()));

            assertThatNoException().isThrownBy(() -> noticeService.getById(100L, claims));
        }

        @Test
        void should_mark_notice_as_read_when_ta_gets_by_id() {
            ScopeHelper.Claims claims = taClaims(5L);
            Notice notice = publishedDistrictNotice(7L);
            when(noticeRepository.findWithAttachmentsById(100L)).thenReturn(Optional.of(notice));
            when(templeRepository.findById(5L)).thenReturn(Optional.of(templeWithDistrict(7L)));
            when(noticeReadRepository.findByNoticeIdAndUserId(100L, 20L)).thenReturn(Optional.empty());
            when(noticeReadRepository.save(any())).thenReturn(null);
            when(noticeMapper.toResponse(any())).thenReturn(new com.templeregistry.dto.response.notice.NoticeResponse());
            when(districtRepository.findById(any())).thenReturn(Optional.of(new District()));
            when(userRepository.findById(any())).thenReturn(Optional.of(new User()));

            noticeService.getById(100L, claims);

            verify(noticeReadRepository).save(argThat(r -> r.getNoticeId().equals(100L) && r.getUserId().equals(20L)));
        }

        private com.templeregistry.entity.temple.Temple templeWithDistrict(Long districtId) {
            com.templeregistry.entity.temple.Temple t = new com.templeregistry.entity.temple.Temple();
            t.setDistrictId(districtId);
            return t;
        }
    }

    // ── TA Dashboard ──────────────────────────────────────────────────────────

    @Nested
    class TaDashboard {

        @Test
        void should_return_only_district_and_global_notices_for_ta_dashboard() {
            ScopeHelper.Claims claims = taClaims(5L);
            com.templeregistry.entity.temple.Temple temple = new com.templeregistry.entity.temple.Temple();
            temple.setDistrictId(7L);
            when(templeRepository.findById(5L)).thenReturn(Optional.of(temple));

            Notice n1 = publishedDistrictNotice(7L);
            when(noticeRepository.findDashboardNotices(eq(7L), any())).thenReturn(List.of(n1));
            when(noticeReadRepository.findReadNoticeIds(eq(20L), any())).thenReturn(Set.of());
            when(noticeMapper.toListItemResponse(n1)).thenReturn(new NoticeListItemResponse());
            when(districtRepository.findById(any())).thenReturn(Optional.of(new District()));
            when(userRepository.findById(any())).thenReturn(Optional.of(new User()));

            List<NoticeListItemResponse> result = noticeService.listForTaDashboard(claims);

            assertThat(result).hasSize(1);
            verify(noticeRepository).findDashboardNotices(eq(7L), any());
        }
    }

    // ── Expiry scheduler ─────────────────────────────────────────────────────

    @Nested
    class ExpiryScheduler {

        @Test
        void should_expire_notices_when_expiry_date_is_past() {
            when(noticeRepository.bulkExpireByDate(any())).thenReturn(3);

            NoticeExpiryScheduler scheduler = new NoticeExpiryScheduler(noticeRepository);
            scheduler.expireOverdueNotices();

            verify(noticeRepository).bulkExpireByDate(LocalDate.now());
        }
    }

    // ── Attachment MIME type ──────────────────────────────────────────────────

    @Nested
    class AttachmentMimeType {

        @Test
        void should_return_correct_mime_type_when_attachment_exists() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(7L);
            NoticeAttachment attachment = new NoticeAttachment();
            attachment.setId(55L);
            attachment.setMimeType("image/png");
            if (notice.getAttachments() == null) {
                notice.setAttachments(new java.util.ArrayList<>());
            }
            notice.getAttachments().add(attachment);
            when(noticeRepository.findWithAttachmentsById(100L)).thenReturn(Optional.of(notice));

            String mimeType = noticeService.getAttachmentMimeType(100L, 55L, claims);

            assertThat(mimeType).isEqualTo("image/png");
        }

        @Test
        void should_return_octet_stream_when_attachment_not_found() {
            ScopeHelper.Claims claims = dcClaims(7L);
            Notice notice = publishedDistrictNotice(7L);
            if (notice.getAttachments() == null) {
                notice.setAttachments(new java.util.ArrayList<>());
            }
            when(noticeRepository.findWithAttachmentsById(100L)).thenReturn(Optional.of(notice));

            String mimeType = noticeService.getAttachmentMimeType(100L, 999L, claims);

            assertThat(mimeType).isEqualTo("application/octet-stream");
        }

        @Test
        void should_throw_not_found_when_notice_does_not_exist_for_mime_lookup() {
            ScopeHelper.Claims claims = dcClaims(7L);
            when(noticeRepository.findWithAttachmentsById(any())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> noticeService.getAttachmentMimeType(999L, 55L, claims))
                    .isInstanceOf(com.templeregistry.exception.EntityNotFoundException.class)
                    .hasMessageContaining("Notice not found");
        }
    }
}
