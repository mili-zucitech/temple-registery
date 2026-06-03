package com.templeregistry.dto.response.admin;

import lombok.*;

/**
 * Lightweight temple projection for the admin "assign existing temple" dropdown.
 * Only includes fields needed for search / display and auto-fill.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TempleOptionResponse {
    private Long id;
    private String name;
    private String registrationNumber;
    private String districtName;
    private String grade;
    private String status;
    /** Included so the frontend can auto-fill the district field when assigning an existing temple. */
    private Long districtId;
    /** Included so the frontend can auto-fill the city field when assigning an existing temple. */
    private Long cityId;
}
