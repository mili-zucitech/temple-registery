package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DcFlagRequest {
    @NotBlank(message = "Reason for flagging is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;
}
