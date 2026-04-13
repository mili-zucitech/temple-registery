package com.templeregistry.dto.response.trust;

import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.entity.trust.TrustType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Builder
public class TrustResponse {
    private Long id;
    private Long templeId;
    private String trustName;
    private TrustType trustType;
    private String registrationNumber;
    private String registeringAuthority;
    private LocalDate dateOfRegistration;
    private String trustPANNumber;
    private String bankAccountNumber;
    private String bankNameAndBranch;
    private BigDecimal annualIncome;
    private TrustStatus status;
    private boolean isActive;
    private LocalDate dissolvedAt;
    private String dissolutionReason;
}
