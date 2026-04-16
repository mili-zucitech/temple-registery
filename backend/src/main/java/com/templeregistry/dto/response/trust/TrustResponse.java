package com.templeregistry.dto.response.trust;

import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.entity.trust.TrustType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustResponse {
    private Long id;
    private Long templeId;
    private String trustName;
    private TrustStatus status;
    private boolean isActive;
    
    private String trustRegistrationNumber;
    private LocalDate dateOfRegistration;
    private String registeringAuthority;
    private TrustType trustType;
    private String trustPANNumber;
    private String bankAccountNumber;
    private String bankNameAndBranch;
    private BigDecimal annualIncome;

    private LocalDate dissolvedAt;
    private String dissolutionReason;

    private boolean isVerifiedByDc;
    private String dcFlagReason;
}
