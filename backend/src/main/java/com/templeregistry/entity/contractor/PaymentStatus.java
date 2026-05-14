package com.templeregistry.entity.contractor;

/**
 * Payment status for contractor contracts.
 */
public enum PaymentStatus {
    PENDING,    // Payment not yet made
    COMPLETED,  // Payment fully completed
    DISPUTED    // Payment under dispute
}
