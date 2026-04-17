package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter @NoArgsConstructor
public class CreateBoardMemberRequest {
    @NotBlank @Size(max = 200) private String fullName;
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar must be 12 digits.") private String aadhaarNumber;
    @Size(max = 150) private String designation;
    private LocalDate appointmentDate;
    private LocalDate tenureEndDate;
    @Size(max = 15) private String contactNumber;
    private String address;
}
