package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request body for recording a board/trustee meeting.
 * Minutes are uploaded separately via POST /api/documents/upload;
 * the returned documentId is passed here to link the document (Step 4.4).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBoardMeetingRequest {

    @NotNull
    private LocalDate meetingDate;

    private String agenda;

    /** Optional at creation; the minutes PDF document ID obtained from a prior upload. */
    private Long minutesDocumentId;
}
