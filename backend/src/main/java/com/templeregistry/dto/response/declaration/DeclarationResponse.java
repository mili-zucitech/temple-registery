package com.templeregistry.dto.response.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Declaration response DTO.
 * Governance field included: sendBackReason.
 * systemVerificationStatus is EXCLUDED — never returned to any caller via this DTO.
 * physicalVerificationStatus is EXCLUDED — DC-only, returned only via DcGovernanceStatusResponse.
 */
@Getter
@Builder
public class DeclarationResponse {
    private Long id;
    /** Workflow instance ID — used by frontend WorkflowGovernancePanel */
    private Long workflowInstanceId;
    private Long templeId;
    private String templeName;
    private Long districtId;
    private String financialYear;
    private Integer versionNumber;
    private DeclarationStatus status;
    private BigDecimal agriculturalLandAcres;
    private BigDecimal agriculturalLandValue;
    private BigDecimal buildingsSqft;
    private BigDecimal buildingsValue;
    private Integer leasedPropertiesCount;
    private BigDecimal leasedPropertiesValue;
    private BigDecimal otherLandValue;
    private BigDecimal goldGrams;
    private BigDecimal silverGrams;
    private Integer idolsCount;
    private Integer vehiclesCount;
    private BigDecimal financialAssetsValue;
    private BigDecimal otherMovableValue;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String acknowledgementNumber;
    private LocalDate dueDate;
    private Boolean overdue;
    private LocalDateTime overdueFlaggedAt;
    private String remarks;

    /** Free-text reason from DC when status is SENT_BACK. Null otherwise. */
    private String sendBackReason;
}
