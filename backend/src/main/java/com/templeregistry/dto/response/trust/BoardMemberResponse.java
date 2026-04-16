package com.templeregistry.dto.response.trust;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    
    @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
    private boolean isCurrent;

    private boolean isVerifiedByDc;
    private String dcFlagReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
