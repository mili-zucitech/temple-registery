package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.AcknowledgementSequence;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Insert-only repository for acknowledgement sequence generation.
 * The saved entity carries the DB-assigned seq_id (LAST_INSERT_ID()).
 */
public interface AcknowledgementSequenceRepository extends JpaRepository<AcknowledgementSequence, Long> {
}
