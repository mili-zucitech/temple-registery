package com.templeregistry.mapper.notice;

import com.templeregistry.dto.response.notice.NoticeAttachmentResponse;
import com.templeregistry.dto.response.notice.NoticeListItemResponse;
import com.templeregistry.dto.response.notice.NoticeResponse;
import com.templeregistry.entity.notice.Notice;
import com.templeregistry.entity.notice.NoticeAttachment;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NoticeMapper {

    /**
     * Maps Notice → NoticeResponse.
     * Fields that require external lookups (districtName, createdByName, read)
     * must be populated by the service layer after calling this mapper.
     */
    @Mapping(target = "districtName", ignore = true)
    @Mapping(target = "createdByName", ignore = true)
    @Mapping(target = "read", ignore = true)
    NoticeResponse toResponse(Notice notice);

    /**
     * Maps Notice → NoticeListItemResponse.
     * attachmentCount, districtName, createdByName, and read must be set by the service.
     */
    @Mapping(target = "districtName", ignore = true)
    @Mapping(target = "createdByName", ignore = true)
    @Mapping(target = "attachmentCount", ignore = true)
    @Mapping(target = "read", ignore = true)
    NoticeListItemResponse toListItemResponse(Notice notice);

    /**
     * Maps NoticeAttachment → NoticeAttachmentResponse.
     * downloadUrl and previewUrl are constructed by the service layer.
     */
    @Mapping(target = "downloadUrl", ignore = true)
    @Mapping(target = "previewUrl", ignore = true)
    NoticeAttachmentResponse toAttachmentResponse(NoticeAttachment attachment);
}
