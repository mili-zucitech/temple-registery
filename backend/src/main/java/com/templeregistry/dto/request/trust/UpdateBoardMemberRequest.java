package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateBoardMemberRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 200)
    private String fullName;

    @NotBlank(message = "Designation is required")
    @Size(max = 150)
    private String designation;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Invalid contact number format")
    private String contactNumber;

    @NotBlank(message = "Address is required")
    private String address;
}
