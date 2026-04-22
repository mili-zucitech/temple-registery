package com.templeregistry.dto.response.trust;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("isCurrent")
    private boolean isCurrent;
    @JsonProperty("isVerifiedByDc")
    private boolean isVerifiedByDc;
    private String dcFlagReason;
}
