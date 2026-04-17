package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

/**
 * Distribution slice for a geo area (Taluk or District), used for dashboard analytics.
 */
@Getter
@Builder
public class AreaDistributionItem {
    private Long areaId;
    private long count;
}

