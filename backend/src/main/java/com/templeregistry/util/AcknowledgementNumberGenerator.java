package com.templeregistry.util;

import com.templeregistry.entity.dc.AcknowledgementSequence;
import com.templeregistry.exception.AcknowledgementNumberConflictException;
import com.templeregistry.repository.dc.AcknowledgementSequenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Generates DB-backed, per-financial-year sequential acknowledgement numbers.
 * Format: TRM/ACK/{FY}/{zero-padded sequence}
 * Example: TRM/ACK/2025-26/000142
 *
 * Uses the acknowledgement_sequences table. Each call INSERTs one row; the
 * DB-assigned seq_id is the atomic sequence number (equivalent to LAST_INSERT_ID()).
 * A zero seq_id is treated as an error per dc_e2e Section 2.7 (S2).
 *
 * Called from within DeclarationWorkflowService.approve() — participates in
 * the caller's active transaction (propagation = REQUIRED).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AcknowledgementNumberGenerator {

    private final AcknowledgementSequenceRepository sequenceRepository;

    @Transactional(propagation = Propagation.REQUIRED)
    public String generate() {
        String fy = financialYear();
        AcknowledgementSequence seq = sequenceRepository.save(
                AcknowledgementSequence.builder().financialYear(fy).build()
        );

        Long seqId = seq.getSeqId();

        // S2 — seq_id zero guard: if MySQL returns 0, the INSERT silently failed
        if (seqId == null || seqId == 0L) {
            throw new AcknowledgementNumberConflictException(fy);
        }

        String ackNumber = String.format("TRM/ACK/%s/%06d", fy, seqId);
        log.info("Generated acknowledgement number: {}", ackNumber);
        return ackNumber;
    }

    private String financialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
        return year + "-" + String.valueOf(year + 1).substring(2);
    }
}

