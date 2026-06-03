package com.templeregistry.dto.response.accesscontrol;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FieldMaskResponse {

    private Long id;
    private String fieldKey;
    private String subjectType;
    private String subjectValue;
    private boolean maskEnabled;
    private String maskPattern;
    private boolean active;
    private LocalDateTime createdAt;
}
