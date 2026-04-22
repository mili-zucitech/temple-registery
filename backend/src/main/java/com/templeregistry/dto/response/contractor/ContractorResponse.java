package com.templeregistry.dto.response.contractor;

import com.templeregistry.entity.contractor.PaymentStatus;
import com.templeregistry.entity.contractor.ServiceType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Builder
public class ContractorResponse {
    private Long id;
    private Long templeId;
    private String companyName;
    private String gstNumber;
    private ServiceType serviceType;
    private String contractReference;
    private LocalDate workOrderDate;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal contractValue;
    private PaymentStatus paymentStatus;
    private List<Long> documentIds; // Multiple documents
    
    // DC Governance fields
    private boolean isVerifiedByDc;
    private String dcFlagReason;
}
