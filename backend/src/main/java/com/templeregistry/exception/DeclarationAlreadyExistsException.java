package com.templeregistry.exception;

/**
 * Exception thrown when attempting to create a new declaration for a financial year
 * that already has an active or submitted declaration.
 */
public class DeclarationAlreadyExistsException extends RuntimeException {
    
    private final String financialYear;
    private final Long existingDeclarationId;
    
    public DeclarationAlreadyExistsException(String financialYear, Long existingDeclarationId) {
        super(String.format("A declaration already exists for financial year %s. Please update the existing declaration (ID: %d) instead of creating a new one.", 
            financialYear, existingDeclarationId));
        this.financialYear = financialYear;
        this.existingDeclarationId = existingDeclarationId;
    }
    
    public String getFinancialYear() {
        return financialYear;
    }
    
    public Long getExistingDeclarationId() {
        return existingDeclarationId;
    }
}
