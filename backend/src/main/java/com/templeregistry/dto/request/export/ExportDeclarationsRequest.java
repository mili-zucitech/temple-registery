package com.templeregistry.dto.request.export;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExportDeclarationsRequest {

    private Long districtId;
    private String status;          // SUBMITTED, APPROVED, REJECTED, etc.
    private String fromDate;        // ISO date string yyyy-MM-dd
    private String toDate;

    @NotNull
    private String format;          // CSV or PDF
}
