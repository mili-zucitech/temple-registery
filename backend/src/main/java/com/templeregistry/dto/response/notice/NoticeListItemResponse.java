package com.templeregistry.dto.response.notice;

import com.templeregistry.entity.notice.NoticePriority;
import com.templeregistry.entity.notice.NoticeScope;
import com.templeregistry.entity.notice.NoticeStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class NoticeListItemResponse {
    private Long id;
    private String title;
    private NoticeScope scope;
    private Long districtId;
    private String districtName;
    private NoticeStatus status;
    private NoticePriority priority;
    private boolean pinned;
    private LocalDate expiryDate;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private String createdByName;
    private int attachmentCount;
    private boolean read;
}
