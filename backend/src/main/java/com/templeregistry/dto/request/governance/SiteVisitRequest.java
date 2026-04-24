package com.templeregistry.dto.request.governance;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request DTO for site visit workflow actions.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SiteVisitRequest {
    /** Optional notes for the site visit. */
    private String notes;
}
