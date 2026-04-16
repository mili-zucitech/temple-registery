package com.templeregistry.dto.response.trust;

import com.templeregistry.entity.trust.TrustType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Builder
public class TrustResponse {
    private Long id; private Long templeId; private String trustName;
    private TrustType trustType; private String registrationNumber;
    private String registeringAuthority; private LocalDate dateOfRegistration;
    private String bankName; private String bankBranch; private BigDecimal annualIncome;
}
