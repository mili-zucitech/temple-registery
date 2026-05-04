package com.templeregistry.dto.response.trust;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
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
    private TrustStatus status;
    @JsonProperty("active")
    private boolean active;
    private LocalDate dissolvedAt;
    private String dissolutionReason;
    private String dcFlagReason;
    private SubmissionStatus submissionStatus;
    private DcDecisionStatus dcDecisionStatus;
    private String sendBackReason;
}
