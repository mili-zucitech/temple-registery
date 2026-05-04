package com.templeregistry.service.clarification;

import lombok.Builder;
import lombok.Getter;

/** Summary of clarification state for the WorkflowEnvelope. */
@Getter
@Builder
public class ClarificationSummary {
    private final int totalRounds;
    private final int activeThreads;
    private final String lastRoundStatus;
    private final String lastRequestedAt;
    private final String lastRespondedAt;
}
