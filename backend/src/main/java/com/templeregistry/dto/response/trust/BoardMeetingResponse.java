package com.templeregistry.dto.response.trust;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class BoardMeetingResponse {
    private Long id;
    private Long trustId;
    private LocalDate meetingDate;
    private String agenda;
    private Long minutesDocumentId;
    private LocalDateTime createdAt;
}
