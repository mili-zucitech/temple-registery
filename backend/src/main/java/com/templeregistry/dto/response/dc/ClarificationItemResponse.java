package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * A single clarification exchange entry in a declaration's clarification history.
 * Direction: DC_TO_TEMPLE (DC asking) or TEMPLE_TO_DC (Temple responding).
 */
@Getter
@Builder
public class ClarificationItemResponse {

    private Long id;
    private String direction;
    private String message;
    private String sectionName;
    /** JSON array string of canonical field identifiers (may be null). */
    private String fieldNamesJson;
    private Long authorId;
    private LocalDateTime createdAt;
}
