package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

/**
 * Represents a board/trustee meeting record.
 * Meeting minutes are uploaded as a separate document; the document ID is stored here.
 * Maps to V16 board_meetings table.
 */
@Entity
@Table(name = "board_meetings", indexes = {
        @Index(name = "idx_board_meetings_trust_id", columnList = "trust_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE board_meetings SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class BoardMeeting extends BaseEntity {

    @Column(name = "trust_id", nullable = false)
    private Long trustId;

    @Column(name = "meeting_date", nullable = false)
    private LocalDate meetingDate;

    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    /** Reference to the uploaded minutes PDF document. Optional at creation; set after upload. */
    @Column(name = "minutes_document_id")
    private Long minutesDocumentId;
}
