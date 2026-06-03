package com.templeregistry.dto.request.notice;

import com.templeregistry.entity.notice.NoticePriority;
import com.templeregistry.entity.notice.NoticeScope;
import com.templeregistry.entity.notice.NoticeStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateNoticeRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @NotBlank
    @Size(min = 10, max = 10000)
    private String body;

    @NotNull
    private NoticeScope scope;

    @NotNull
    private NoticePriority priority;

    /** Only DRAFT or PUBLISHED are valid on creation. */
    @NotNull
    private NoticeStatus status;

    private boolean pinned;

    @Future
    private LocalDate expiryDate;
}
