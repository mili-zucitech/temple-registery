package com.templeregistry.dto.request.notice;

import com.templeregistry.entity.notice.NoticePriority;
import com.templeregistry.entity.notice.NoticeStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateNoticeRequest {

    @Size(min = 3, max = 255)
    private String title;

    @Size(min = 10, max = 10000)
    private String body;

    private NoticePriority priority;

    private NoticeStatus status;

    private Boolean pinned;

    @Future
    private LocalDate expiryDate;
}
