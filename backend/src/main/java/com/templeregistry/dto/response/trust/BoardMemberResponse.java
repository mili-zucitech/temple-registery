package com.templeregistry.dto.response.trust;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter @Builder
public class BoardMemberResponse {
    private Long id;
    private Long trustId;
    private String fullName;
    private String maskedAadhaar;
    private String designation;
    private LocalDate appointmentDate;
    private LocalDate tenureEndDate;
    private String contactNumber;
    private String address;
    private boolean isCurrent;
}
