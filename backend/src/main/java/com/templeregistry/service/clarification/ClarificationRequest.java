package com.templeregistry.service.clarification;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** Request DTO for DC to open a new clarification round. */
@Getter
@Builder
public class ClarificationRequest {
    private final String message;
    /** Optional: which section this targets (e.g., "Trust Details") */
    private final String sectionName;
    /** Optional: specific field names e.g. ["trustName", "regNumber"] */
    private final List<String> fieldNames;
}
