package com.templeregistry.service.clarification;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/** TA response to an open clarification thread. */
@Getter
@Builder
public class ClarificationResponse {
    private final String message;
    /** Optional file paths of uploaded attachments. */
    private final List<String> attachmentPaths;
    private final List<String> attachmentNames;
}
