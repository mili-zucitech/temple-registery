package com.templeregistry.dto.request.contractor;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @NoArgsConstructor
public class CreateContractorRequest {
    @NotBlank @Size(max = 255) private String name;
    @Size(max = 30) private String gstNumber;
    @Size(max = 255) private String serviceType;
    @Size(max = 100) private String contractReference;
    private LocalDate workOrderDate;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal contractValue;
    @Size(max = 50) private String paymentStatus;
    private Long documentId;
}
