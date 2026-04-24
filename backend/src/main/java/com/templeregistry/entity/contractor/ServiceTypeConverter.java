package com.templeregistry.entity.contractor;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA converter for ServiceType that gracefully handles unknown/legacy string
 * values stored in the database (e.g. free-text from seed data).
 * Unknown values are mapped to {@link ServiceType#OTHER}.
 */
@Converter(autoApply = false)
@Slf4j
public class ServiceTypeConverter implements AttributeConverter<ServiceType, String> {

    @Override
    public String convertToDatabaseColumn(ServiceType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ServiceType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return ServiceType.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown ServiceType value '{}' in database — defaulting to OTHER", dbData);
            return ServiceType.OTHER;
        }
    }
}
