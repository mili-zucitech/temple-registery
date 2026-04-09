package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Insert-only sequence table for acknowledgement number generation.
 * One row is inserted per APPROVED declaration; the generated seq_id
 * is the per-financial-year sequence number.
 *
 * NEVER UPDATE or DELETE rows from this table.
 * dc_e2e Section 2.7 and Section 4.12a.
 */
@Entity
@Table(name = "acknowledgement_sequences")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcknowledgementSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seq_id")
    private Long seqId;

    @Column(name = "financial_year", nullable = false, length = 7)
    private String financialYear;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
