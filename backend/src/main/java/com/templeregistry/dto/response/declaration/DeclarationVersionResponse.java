package com.templeregistry.dto.response.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeclarationVersionResponse {
    private Long id;
    private Integer versionNumber;
    private DeclarationStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String acknowledgementNumber;
    private Long reviewedBy;
    private String remarks;
    private LocalDateTime createdAt;
}
