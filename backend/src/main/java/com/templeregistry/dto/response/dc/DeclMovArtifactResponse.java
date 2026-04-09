package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclMovArtifactResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal estimatedValue;
    private String storageLocation;
}
