package com.templeregistry.entity.contractor;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

/**
 * JPA converter for PaymentStatus that gracefully handles unknown/legacy string
 * values stored in the database (e.g. 'PAID', 'PARTIAL' from seed data).
 * Unknown values are mapped to {@link PaymentStatus#PENDING}.
 */
@Converter(autoApply = false)
@Slf4j
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown PaymentStatus value '{}' in database — defaulting to PENDING", dbData);
            return PaymentStatus.PENDING;
        }
    }
}
