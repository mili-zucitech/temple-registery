package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request body for updating an existing board member record.
 * Used to edit details or to mark a member as resigned.
 * tenureEndDate (cessation date) is required by VAL-014 when isCurrent transitions to false.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBoardMemberRequest {

    private String fullName;
    private String designation;
    private LocalDate appointmentDate;
    private String contactNumber;
    private String address;

    /**
     * Set to false to mark the member as resigned/retired (historical).
     * When false, tenureEndDate is mandatory (VAL-014).
     */
    private Boolean current;

    /**
     * Cessation date — mandatory when current = false (VAL-014).
     * Maps to tenure_end_date column.
     */
    private LocalDate tenureEndDate;
}
