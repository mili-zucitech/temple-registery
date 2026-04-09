package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for the DC request-clarification workflow action.
 *
 * sectionName and fieldNames target a specific asset section, enabling the
 * Temple Authority to understand precisely which data needs correction.
 * Stored in DeclarationClarification.sectionName / fieldNamesJson.
 *
 * dc_e2e Section 5.2. direction = DC_TO_TEMPLE set by service layer.
 */
@Getter
@NoArgsConstructor
public class DcClarifyRequest {

    @NotBlank(message = "Clarification message is required.")
    @Size(min = 10, max = 2000, message = "Message must be between 10 and 2000 characters.")
    private String message;

    /** Optional: name of the asset section requiring clarification (e.g. "IMMOVABLE_LAND", "MOVABLE_GOLD"). */
    @Size(max = 100, message = "Section name must not exceed 100 characters.")
    private String sectionName;

    /** Optional: list of specific field names within the section. */
    private List<String> fieldNames;
}
