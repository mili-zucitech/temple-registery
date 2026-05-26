package com.templeregistry.service.notice;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.notice.ChangeNoticeStatusRequest;
import com.templeregistry.dto.request.notice.CreateNoticeRequest;
import com.templeregistry.dto.request.notice.NoticeListFilter;
import com.templeregistry.dto.request.notice.UpdateNoticeRequest;
import com.templeregistry.dto.response.notice.NoticeListItemResponse;
import com.templeregistry.dto.response.notice.NoticeResponse;
import com.templeregistry.security.ScopeHelper;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NoticeService {

    NoticeResponse createNotice(CreateNoticeRequest request, ScopeHelper.Claims claims);

    NoticeResponse updateNotice(Long id, UpdateNoticeRequest request, ScopeHelper.Claims claims);

    void deleteNotice(Long id, ScopeHelper.Claims claims);

    NoticeResponse changeStatus(Long id, ChangeNoticeStatusRequest request, ScopeHelper.Claims claims);

    /** Detail view — marks notice as read for the calling user. */
    NoticeResponse getById(Long id, ScopeHelper.Claims claims);

    PaginatedResponse<NoticeListItemResponse> listForDc(NoticeListFilter filter, Pageable pageable, ScopeHelper.Claims claims);

    PaginatedResponse<NoticeListItemResponse> listForAdmin(NoticeListFilter filter, Pageable pageable);

    /** Returns the top-5 active notices for the TA's district, pinned first. */
    List<NoticeListItemResponse> listForTaDashboard(ScopeHelper.Claims claims);

    NoticeResponse addAttachment(Long noticeId, MultipartFile file, ScopeHelper.Claims claims);

    void removeAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims);

    Resource downloadAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims);

    Resource previewAttachment(Long noticeId, Long attachmentId, ScopeHelper.Claims claims);

    /** Returns the stored MIME type for the given attachment (used to set Content-Type on preview). */
    String getAttachmentMimeType(Long noticeId, Long attachmentId, ScopeHelper.Claims claims);
}
