package com.templeregistry.dto.response.trust;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.entity.trust.TrustType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Builder
public class TrustResponse {
    private Long id;
    /** Workflow instance ID — used by frontend WorkflowGovernancePanel */
    private Long workflowInstanceId;
    private Long templeId;
    private String trustName;
    private TrustType trustType;
    private String registrationNumber;
    private String registeringAuthority;
    private LocalDate dateOfRegistration;
    private String maskedPanNumber;
    private String maskedBankAccountNumber;
    private String bankName;
    private String bankBranch;
    private BigDecimal annualIncome;
    /** Entity lifecycle status — ACTIVE / DISSOLVED. NOT a governance status. */
    private TrustStatus status;
    @JsonProperty("active")
    private boolean active;
    private LocalDate dissolvedAt;
    private String dissolutionReason;
    /** DC send-back reason text — display data, kept as separate field. */
    private String sendBackReason;
    /** Canonical governance status — single source of truth for TA/DC/Auditor views. */
    private GovernanceStatusPayload governanceStatus;
}
