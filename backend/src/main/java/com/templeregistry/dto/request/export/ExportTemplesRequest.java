package com.templeregistry.dto.request.export;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExportTemplesRequest {

    private Long districtId;
    private String grade;           // A, B, C
    private String tradition;
    private Boolean trustRegistered;

    @NotNull
    private String format;          // CSV or PDF
}
