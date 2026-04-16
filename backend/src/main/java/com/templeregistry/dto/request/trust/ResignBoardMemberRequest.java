package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ResignBoardMemberRequest {
    @NotNull(message = "Cessation date is required")
    private LocalDate cessationDate;
}
