package com.templeregistry.dto.response.contractor;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Contractor response DTO.
 * No DC approval workflow applies to Contractors — changes are effective immediately.
 * No verification/compliance fields are exposed.
 */
@Getter @Builder
public class ContractorResponse {
    private Long id;
    private Long templeId;
    private String name;
    private String gstNumber;
    private String serviceType;
    private String contractReference;
    private LocalDate workOrderDate;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal contractValue;
    private String paymentStatus;
}
