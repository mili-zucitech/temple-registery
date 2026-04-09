package com.templeregistry.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Generates acknowledgement numbers in the format: TRM/ACK/{FY}/{SEQUENCE}.
 * Example: TRM/ACK/2025-26/000142
 * In production, sequence should be persisted (e.g., a DB sequence or Redis counter).
 * This in-memory implementation is suitable for development only.
 */
@Component
public class AcknowledgementNumberGenerator {

    private final AtomicLong sequence = new AtomicLong(0);

    public String generate() {
        String fy = financialYear();
        long seq = sequence.incrementAndGet();
        return String.format("TRM/ACK/%s/%06d", fy, seq);
    }

    private String financialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
        return year + "-" + String.valueOf(year + 1).substring(2);
    }
}
