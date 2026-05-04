package com.templeregistry.service.clarification.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.clarification.*;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.exception.WorkflowException;
import com.templeregistry.repository.clarification.ClarificationThreadRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.clarification.*;
import com.templeregistry.service.workflow.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClarificationEngineImpl implements ClarificationEngine {

    private final ClarificationThreadRepository threadRepo;
    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowEngine workflowEngine;
    private final ObjectMapper objectMapper;

    private static final int MAX_ESCALATION_ROUND = 2;

    @Override
    @Transactional
    public ClarificationThread requestClarification(Long workflowInstanceId,
                                                     ClarificationRequest request,
                                                     Long requestedByUserId,
                                                     String idempotencyKey) {
        WorkflowInstance instance = instanceRepo.findById(workflowInstanceId)
            .orElseThrow(() -> new WorkflowException("WorkflowInstance not found: " + workflowInstanceId));

        int nextRound = threadRepo.findMaxRoundNumber(workflowInstanceId).orElse(0) + 1;
        int escalationLevel = nextRound >= MAX_ESCALATION_ROUND ? 1 : 0;

        // Build thread
        ClarificationThread thread = ClarificationThread.builder()
            .workflowInstance(instance)
            .roundNumber(nextRound)
            .status(ClarificationStatus.OPEN)
            .requestedBy(requestedByUserId)
            .requestedAt(Instant.now())
            .escalationLevel(escalationLevel)
            .messages(new ArrayList<>())
            .build();

        // Build initial message from DC
        String fieldNamesJson = toJson(request.getFieldNames());
        ClarificationMessage msg = ClarificationMessage.builder()
            .thread(thread)
            .direction(ClarificationMessageDirection.DC_TO_TA)
            .authorId(requestedByUserId)
            .message(request.getMessage())
            .sectionName(request.getSectionName())
            .fieldNamesJson(fieldNamesJson)
            .createdAtInstant(Instant.now())
            .attachments(new ArrayList<>())
            .build();

        thread.getMessages().add(msg);
        ClarificationThread saved = threadRepo.save(thread);

        // Transition workflow: → CLARIFICATION_REQUESTED
        workflowEngine.execute(workflowInstanceId,
            WorkflowActionRequest.builder()
                .action(com.templeregistry.entity.workflow.WorkflowAction.REQUEST_CLARIFICATION)
                .idempotencyKey(effectiveIdempotencyKey(idempotencyKey))
                .comment("Round " + nextRound + ": " + request.getMessage())
                .build(),
            ActionContext.builder()
                .actorId(requestedByUserId)
                .actorRole("DC")
                .actorDistrictId(instance.getDistrictId())
                .build()
        );

        log.info("[ClarificationEngine] Round {} opened for instance={}", nextRound, workflowInstanceId);
        return saved;
    }

    @Override
    @Transactional
    public ClarificationMessage respond(Long threadId, ClarificationResponse response, Long respondedByUserId) {
        ClarificationThread thread = threadRepo.findById(threadId)
            .orElseThrow(() -> new WorkflowException("ClarificationThread not found: " + threadId));

        if (thread.getStatus() != ClarificationStatus.OPEN) {
            throw new WorkflowException("Thread " + threadId + " is not OPEN (status=" + thread.getStatus() + ")");
        }

        // Build TA response message
        ClarificationMessage msg = ClarificationMessage.builder()
            .thread(thread)
            .direction(ClarificationMessageDirection.TA_TO_DC)
            .authorId(respondedByUserId)
            .message(response.getMessage())
            .createdAtInstant(Instant.now())
            .attachments(buildAttachments(response))
            .build();

        thread.getMessages().add(msg);
        thread.setStatus(ClarificationStatus.RESPONDED);
        thread.setRespondedBy(respondedByUserId);
        thread.setRespondedAt(Instant.now());
        threadRepo.save(thread);

        // Transition workflow: → CLARIFICATION_RESPONDED
        Long instanceId = thread.getWorkflowInstance().getId();
        workflowEngine.execute(instanceId,
            WorkflowActionRequest.builder()
                .action(com.templeregistry.entity.workflow.WorkflowAction.RESPOND_CLARIFICATION)
                .idempotencyKey(UUID.randomUUID().toString())
                .comment(response.getMessage())
                .build(),
            ActionContext.builder()
                .actorId(respondedByUserId)
                .actorRole("TA")
                .ownedTempleIds(java.util.Set.of(thread.getWorkflowInstance().getTempleId()))
                .build()
        );

        log.info("[ClarificationEngine] TA responded to thread={}", threadId);
        return msg;
    }

    @Override
    @Transactional
    public ClarificationMessage followUp(Long threadId, String message, Long dcUserId) {
        ClarificationThread thread = threadRepo.findById(threadId)
            .orElseThrow(() -> new WorkflowException("ClarificationThread not found: " + threadId));

        ClarificationMessage msg = ClarificationMessage.builder()
            .thread(thread)
            .direction(ClarificationMessageDirection.DC_TO_TA)
            .authorId(dcUserId)
            .message(message)
            .createdAtInstant(Instant.now())
            .attachments(new ArrayList<>())
            .build();

        thread.getMessages().add(msg);
        thread.setStatus(ClarificationStatus.OPEN); // re-open after TA response
        threadRepo.save(thread);
        return msg;
    }

    @Override
    @Transactional
    public void resolve(Long threadId, Long resolvedByUserId) {
        ClarificationThread thread = threadRepo.findById(threadId)
            .orElseThrow(() -> new WorkflowException("ClarificationThread not found: " + threadId));
        thread.setStatus(ClarificationStatus.RESOLVED);
        thread.setResolvedBy(resolvedByUserId);
        thread.setResolvedAt(Instant.now());
        threadRepo.save(thread);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClarificationThread> getThreads(Long workflowInstanceId) {
        return threadRepo.findByWorkflowInstanceIdOrderByRoundNumberAsc(workflowInstanceId);
    }

    @Override
    @Transactional(readOnly = true)
    public ClarificationSummary getSummary(Long workflowInstanceId) {
        List<ClarificationThread> threads = getThreads(workflowInstanceId);
        long active = threads.stream()
            .filter(t -> t.getStatus() == ClarificationStatus.OPEN || t.getStatus() == ClarificationStatus.RESPONDED)
            .count();
        ClarificationThread last = threads.isEmpty() ? null : threads.get(threads.size() - 1);
        return ClarificationSummary.builder()
            .totalRounds(threads.size())
            .activeThreads((int) active)
            .lastRoundStatus(last != null ? last.getStatus().name() : null)
            .lastRequestedAt(last != null && last.getRequestedAt() != null ? last.getRequestedAt().toString() : null)
            .lastRespondedAt(last != null && last.getRespondedAt() != null ? last.getRespondedAt().toString() : null)
            .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try { return objectMapper.writeValueAsString(list); }
        catch (Exception e) { return null; }
    }

    private List<ClarificationAttachment> buildAttachments(ClarificationResponse response) {
        List<ClarificationAttachment> attachments = new ArrayList<>();
        if (response.getAttachmentPaths() == null) return attachments;
        for (int i = 0; i < response.getAttachmentPaths().size(); i++) {
            String path = response.getAttachmentPaths().get(i);
            String name = response.getAttachmentNames() != null && i < response.getAttachmentNames().size()
                ? response.getAttachmentNames().get(i) : path;
            attachments.add(ClarificationAttachment.builder()
                .filePath(path).fileName(name).build());
        }
        return attachments;
    }

    private String effectiveIdempotencyKey(String clientProvidedKey) {
        return StringUtils.hasText(clientProvidedKey)
            ? clientProvidedKey
            : UUID.randomUUID().toString();
    }
}
