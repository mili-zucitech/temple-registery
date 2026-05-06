package com.templeregistry.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SystemConfigResponse {
    private Long id;
    private String configKey;
    private String configValue;
    private String dataType;
    private String category;
    private String description;
    private boolean active;
}
