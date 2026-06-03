package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class DissolveTrustRequest {
    @NotNull(message = "Dissolution date is required")
    private LocalDate dissolutionDate;

    @NotBlank(message = "Dissolution reason is required")
    private String dissolutionReason;
}
