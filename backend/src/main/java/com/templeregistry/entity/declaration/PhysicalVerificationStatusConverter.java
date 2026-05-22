package com.templeregistry.entity.declaration;

import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA AttributeConverter for {@link PhysicalVerificationStatus}.
 *
 * <p>Guards against blank/null DB values (seeded before the column had a NOT NULL DEFAULT)
 * and any future legacy names, returning {@code NOT_INITIATED} as the safe default
 * instead of throwing {@code IllegalArgumentException} → HTTP 500.
 */
@Converter(autoApply = false)
@Slf4j
public class PhysicalVerificationStatusConverter
        implements AttributeConverter<PhysicalVerificationStatus, String> {

    @Override
    public String convertToDatabaseColumn(PhysicalVerificationStatus attribute) {
        return attribute == null ? PhysicalVerificationStatus.NOT_INITIATED.name() : attribute.name();
    }

    @Override
    public PhysicalVerificationStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            log.warn("Blank physical_verification_status in database — defaulting to NOT_INITIATED");
            return PhysicalVerificationStatus.NOT_INITIATED;
        }
        try {
            return PhysicalVerificationStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown PhysicalVerificationStatus value '{}' in database — defaulting to NOT_INITIATED", dbData);
            return PhysicalVerificationStatus.NOT_INITIATED;
        }
    }
}
