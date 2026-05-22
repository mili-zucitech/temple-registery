package com.templeregistry.entity.temple;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * JPA AttributeConverter for {@link TempleProfileStagingStatus} that resolves legacy enum names
 * without throwing {@code IllegalArgumentException} (which would propagate as HTTP 500).
 *
 * <p>Migrations keep the DB values canonical, but this converter acts as a safety net so
 * that any residual legacy values from hand-seeded data or future migrations do not crash
 * the application.
 *
 * <p>Legacy → canonical mappings (mirrors the workflow → staging status semantics):
 * <ul>
 *   <li>{@code SUBMITTED}              → {@code PENDING_REVIEW}</li>
 *   <li>{@code RE_APPROVED}            → {@code APPROVED}</li>
 *   <li>{@code UPDATED_AFTER_APPROVAL} → {@code APPROVED}</li>
 * </ul>
 */
@Converter(autoApply = false)
@Slf4j
public class TempleProfileStagingStatusConverter
        implements AttributeConverter<TempleProfileStagingStatus, String> {

    private static final Map<String, String> LEGACY_ALIASES = Map.of(
            "SUBMITTED",              "PENDING_REVIEW",
            "RE_APPROVED",            "APPROVED",
            "UPDATED_AFTER_APPROVAL", "APPROVED"
    );

    @Override
    public String convertToDatabaseColumn(TempleProfileStagingStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public TempleProfileStagingStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        String normalised = dbData.trim().toUpperCase();
        String canonical  = LEGACY_ALIASES.getOrDefault(normalised, normalised);
        try {
            return TempleProfileStagingStatus.valueOf(canonical);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown TempleProfileStagingStatus value '{}' in database — returning null", dbData);
            return null;
        }
    }
}
