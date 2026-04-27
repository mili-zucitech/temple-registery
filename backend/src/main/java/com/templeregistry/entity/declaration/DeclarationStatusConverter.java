package com.templeregistry.entity.declaration;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * JPA AttributeConverter for {@link DeclarationStatus} that resolves legacy enum names
 * stored in the database to their current canonical equivalents.
 *
 * <p>Migration V42 renamed several status values, but seed data and older rows may still
 * contain the pre-V42 names. Without this converter, Hibernate throws
 * {@code IllegalArgumentException} when it reads a stale value, causing HTTP 500 on any
 * endpoint that loads declarations.
 *
 * <p>Legacy alias map (mirrors {@code DeclarationServiceImpl.LEGACY_ALIASES}):
 * <ul>
 *   <li>{@code CLARIFICATION_REQUESTED} → {@code CLARIFICATION_REQUIRED}</li>
 *   <li>{@code PENDING_REVIEW}          → {@code SUBMITTED}</li>
 *   <li>{@code RESUBMITTED}             → {@code SUBMITTED}</li>
 *   <li>{@code PHYSICAL_VERIFICATION_REQUESTED} → {@code SITE_VISIT_SCHEDULED}</li>
 * </ul>
 *
 * <p>Truly unknown values (not a legacy alias and not a current constant) are logged as
 * warnings and mapped to {@code null} to avoid crashing the entire result set.
 */
@Converter(autoApply = false)
@Slf4j
public class DeclarationStatusConverter implements AttributeConverter<DeclarationStatus, String> {

    /**
     * All known legacy → canonical mappings from V42.
     * Keyed on the upper-cased legacy name for O(1) lookup.
     */
    private static final Map<String, String> LEGACY_ALIASES = Map.of(
            "CLARIFICATION_REQUESTED",        "CLARIFICATION_REQUIRED",
            "PENDING_REVIEW",                 "SUBMITTED",
            "RESUBMITTED",                    "SUBMITTED",
            "PHYSICAL_VERIFICATION_REQUESTED","SITE_VISIT_SCHEDULED"
    );

    @Override
    public String convertToDatabaseColumn(DeclarationStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public DeclarationStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        String normalised = dbData.trim().toUpperCase();
        String canonical  = LEGACY_ALIASES.getOrDefault(normalised, normalised);
        try {
            return DeclarationStatus.valueOf(canonical);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown DeclarationStatus value '{}' in database — returning null", dbData);
            return null;
        }
    }
}
