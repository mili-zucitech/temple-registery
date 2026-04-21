package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor
public class CreateBoardMemberRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 200)
    private String fullName;

    @NotBlank(message = "Aadhaar number is required")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar must be exactly 12 digits")
    private String aadhaarNumber;

    @NotBlank(message = "Designation is required")
    @Size(max = 150)
    private String designation;

    @NotNull(message = "Appointment date is required")
    @PastOrPresent(message = "Appointment date cannot be in the future")
    private LocalDate appointmentDate;

    private LocalDate tenureEndDate;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    private String contactNumber;

    @NotBlank(message = "Address is required")
    private String address;
}
