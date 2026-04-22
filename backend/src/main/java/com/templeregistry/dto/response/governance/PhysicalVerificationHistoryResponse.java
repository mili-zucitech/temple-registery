package com.templeregistry.dto.response.governance;

import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Physical verification history entry — DC-only.
 * MUST NEVER be returned to Temple Authority.
 */
@Getter
@Builder
public class PhysicalVerificationHistoryResponse {

    private Long id;
    private Long declarationId;
    private Long dcUserId;
    private PhysicalVerificationStatus previousStatus;
    private PhysicalVerificationStatus newStatus;
    private String notes;
    private LocalDateTime occurredAt;
}
