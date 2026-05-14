package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DcVerifyRequest {
    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
}
