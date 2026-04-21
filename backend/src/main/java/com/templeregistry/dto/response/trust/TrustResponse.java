package com.templeregistry.dto.response.trust;

import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.entity.trust.TrustType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Public trust response DTO.
 * Raw PAN and bank account numbers are intentionally excluded — only masked values are returned.
 * This prevents PII leakage to any authenticated caller regardless of role.
 */
@Getter @Builder
public class TrustResponse {
    private Long id;
    private Long templeId;
    private String trustName;
    private TrustType trustType;
    private String registrationNumber;
    private String registeringAuthority;
    private LocalDate dateOfRegistration;
    /** Always masked (e.g. AB*****4F). Never the raw PAN. */
    private String maskedPanNumber;
    /** Always masked (e.g. ******1234). Never the raw account number. */
    private String maskedBankAccountNumber;
    private String bankName;
    private String bankBranch;
    private BigDecimal annualIncome;
    private TrustStatus status;
    private boolean isActive;
    private LocalDate dissolvedAt;
    private String dissolutionReason;
    private boolean isVerifiedByDc;
    private String dcFlagReason;
}
