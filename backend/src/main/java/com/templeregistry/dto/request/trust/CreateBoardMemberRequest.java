package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class CreateBoardMemberRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 200)
    private String fullName;

    @NotBlank(message = "Aadhaar is required")
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be 12 digits")
    private String aadhaar;

    @NotBlank(message = "Designation is required")
    @Size(max = 150)
    private String designation;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    private LocalDate tenureEndDate;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Invalid contact number format")
    private String contactNumber;

    @NotBlank(message = "Address is required")
    private String address;
}
