package com.templeregistry.dto.request.notice;

import com.templeregistry.entity.notice.NoticePriority;
import com.templeregistry.entity.notice.NoticeScope;
import com.templeregistry.entity.notice.NoticeStatus;
import lombok.Data;

@Data
public class NoticeListFilter {

    private NoticeStatus status;
    private NoticePriority priority;
    private NoticeScope scope;

    /** SA-only: filter by a specific district. */
    private Long districtId;

    /** Title keyword search. */
    private String search;
}
