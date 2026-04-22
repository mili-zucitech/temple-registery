package com.templeregistry.dto.response.declaration;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class GoldSilverItemResponse {
    private Long id;
    private Long declarationId;
    private String itemDescription;
    private BigDecimal weightGrams;
    private String purity;
    private BigDecimal approximateValue;
    private String itemType;
    private java.time.LocalDate acquisitionDate;
    private String storageLocation;
    private String documentReference;
}
