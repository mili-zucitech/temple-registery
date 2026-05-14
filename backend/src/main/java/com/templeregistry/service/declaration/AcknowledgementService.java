package com.templeregistry.service.declaration;

import com.templeregistry.dto.response.declaration.AcknowledgementResponse;

/**
 * Service for generating and retrieving declaration acknowledgement numbers.
 * Format: ACK-{DISTRICT_CODE}-{FINANCIAL_YEAR}-{SEQUENCE}
 * Example: ACK-CBE-2025-26-000042
 */
public interface AcknowledgementService {

    /**
     * Generates a unique acknowledgement number for the given district and financial year.
     * Uses SERIALIZABLE isolation to prevent duplicate sequences.
     *
     * @param districtId    the district ID
     * @param financialYear the financial year in YYYY-YY format
     * @return the generated acknowledgement number
     */
    String generate(Long districtId, String financialYear);

    /**
     * Returns the acknowledgement details for an APPROVED declaration.
     *
     * @param declarationId the declaration ID
     * @return acknowledgement response with number, date, and download URL
     * @throws com.templeregistry.exception.AcknowledgementNotAvailableException if not APPROVED
     */
    AcknowledgementResponse getForDeclaration(Long declarationId);
}
