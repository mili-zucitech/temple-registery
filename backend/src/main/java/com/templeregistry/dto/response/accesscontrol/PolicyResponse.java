package com.templeregistry.dto.response.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.accesscontrol.enums.TargetType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PolicyResponse {

    private Long id;
    private TargetType targetType;
    private String targetKey;
    private SubjectType subjectType;
    private String subjectValue;
    private PolicyEffect effect;
    private boolean active;
    private String conditions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
