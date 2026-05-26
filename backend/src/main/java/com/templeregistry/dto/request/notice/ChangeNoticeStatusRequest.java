package com.templeregistry.dto.request.notice;

import com.templeregistry.entity.notice.NoticeStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeNoticeStatusRequest {

    @NotNull
    private NoticeStatus targetStatus;
}
