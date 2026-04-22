package com.templeregistry.dto.request.contractor;

import com.templeregistry.entity.contractor.PaymentStatus;
import com.templeregistry.entity.contractor.ServiceType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @NoArgsConstructor
public class CreateContractorRequest {
    @NotBlank @Size(max = 255) private String companyName;
    @Size(max = 30) private String gstNumber;
    private ServiceType serviceType;
    @Size(max = 100) private String contractReference;
    private LocalDate workOrderDate;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private BigDecimal contractValue;
    private PaymentStatus paymentStatus;
    private List<Long> documentIds; // Support multiple documents
}
