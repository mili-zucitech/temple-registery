package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IdolArtifactItemRequest {

    @NotBlank(message = "Item description is required")
    private String itemDescription;

    private String material; // e.g., "Bronze", "Stone", "Gold"

    private String agePeriod; // e.g., "Chola Period", "200 years old"

    private String knownProvenance; // History/origin of the artifact

    private Boolean museumGradeClassification; // true if museum-grade
}
