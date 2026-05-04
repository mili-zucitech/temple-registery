package com.templeregistry.service.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.templeregistry.entity.versioning.EntityVersion;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.repository.versioning.EntityVersionRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

/**
 * VersionService — captures and diffs immutable entity snapshots.
 *
 * Responsibilities:
 *   1. snapshot()     — serialize current entity state to JSON, persist as EntityVersion
 *   2. diff()         — compute field-level diff between two version snapshots
 *   3. findLatest()   — retrieve most recent snapshot for an entity
 *
 * Called by WorkflowEngineImpl during SUBMIT and EDIT_APPROVED transitions.
 * Replaces the ad-hoc AssetDeclarationVersion + SnapshotService pattern.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VersionService {

    private final EntityVersionRepository versionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final ObjectMapper objectMapper;

    // ─── Snapshot ─────────────────────────────────────────────────────────────

    /**
     * Capture an immutable JSON snapshot of the given entity.
     * The entity is serialized via ObjectMapper — ensure @JsonIgnore annotations
     * hide sensitive fields (PAN, Aadhaar, bank accounts) before calling.
     *
     * @param entityType       Module type (TRUST, DECLARATION, TEMPLE_PROFILE, BOARD_MEMBER)
     * @param entityId         Entity PK
     * @param versionNumber    Business version number (from WorkflowInstance.versionNumber)
     * @param entity           The entity to snapshot (any serializable object)
     * @param triggeredByUserId Actor who triggered the snapshot
     * @param transitionId     Workflow transition ID for auditability
     * @return persisted EntityVersion
     */
    @Transactional
    public EntityVersion snapshot(
        WorkflowEntityType entityType, Long entityId,
        int versionNumber, Object entity,
        Long triggeredByUserId, Long transitionId
    ) {
        // Load the WorkflowInstance to satisfy the @ManyToOne FK constraint
        com.templeregistry.entity.workflow.WorkflowInstance workflowInstance =
            workflowInstanceRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .orElseThrow(() -> new IllegalStateException(
                    "No workflow instance found for " + entityType + ":" + entityId +
                    " — cannot snapshot without a workflow instance"));

        // Compute diff against previous snapshot
        String diffJson = null;
        Optional<EntityVersion> previous = versionRepository
            .findTopByEntityTypeAndEntityIdOrderByVersionNumberDesc(entityType.name(), entityId);

        String snapshotJson = serialize(entity);

        if (previous.isPresent()) {
            try {
                JsonNode oldNode = objectMapper.readTree(previous.get().getSnapshotJson());
                JsonNode newNode = objectMapper.readTree(snapshotJson);
                List<FieldDiff> diffs = computeDiff("", oldNode, newNode);
                diffJson = objectMapper.writeValueAsString(diffs);
            } catch (Exception e) {
                log.warn("[VersionService] Failed to compute diff for entityId={}: {}", entityId, e.getMessage());
            }
        }

        EntityVersion version = EntityVersion.builder()
            .workflowInstance(workflowInstance)  // FIX: set the FK to satisfy nullable=false
            .entityType(entityType.name())
            .entityId(entityId)
            .versionNumber(versionNumber)
                .status(com.templeregistry.entity.versioning.EntityVersionStatus.DRAFT_OVERLAY)
            .snapshotJson(snapshotJson)
            .diffJson(diffJson)
            .capturedAt(Instant.now())
            .capturedByUserId(triggeredByUserId)
            .createdByUserId(triggeredByUserId != null ? triggeredByUserId : 0L)
            .triggeringTransitionId(transitionId)
            .build();

        EntityVersion saved = versionRepository.save(version);
        log.info("[VersionService] Snapshot captured: entityType={} entityId={} v{}",
            entityType, entityId, versionNumber);
        return saved;
    }

    // ─── Diff ─────────────────────────────────────────────────────────────────

    /**
     * Compute a human-readable field-level diff between two version snapshots.
     */
    @Transactional(readOnly = true)
    public List<FieldDiff> diff(WorkflowEntityType entityType, Long entityId,
                                 int fromVersion, int toVersion) {
        EntityVersion from = versionRepository
            .findByEntityTypeAndEntityIdAndVersionNumber(entityType.name(), entityId, fromVersion)
            .orElseThrow(() -> new IllegalArgumentException(
                "Version " + fromVersion + " not found for " + entityType + "#" + entityId));

        EntityVersion to = versionRepository
            .findByEntityTypeAndEntityIdAndVersionNumber(entityType.name(), entityId, toVersion)
            .orElseThrow(() -> new IllegalArgumentException(
                "Version " + toVersion + " not found for " + entityType + "#" + entityId));

        try {
            JsonNode oldNode = objectMapper.readTree(from.getSnapshotJson());
            JsonNode newNode = objectMapper.readTree(to.getSnapshotJson());
            return computeDiff("", oldNode, newNode);
        } catch (Exception e) {
            log.error("[VersionService] Diff failed for entityId={}: {}", entityId, e.getMessage());
            return List.of();
        }
    }

    /**
     * Persist a pre-built EntityVersion directly.
     * Used by WorkflowEngineImpl.initiate() to write the initial v1 DRAFT_OVERLAY row
     * without going through the full snapshot() serialization path.
     */
    @Transactional
    public EntityVersion saveRaw(EntityVersion version) {
        EntityVersion saved = versionRepository.save(version);
        log.info("[VersionService] Raw version saved: entityType={} entityId={} v{} status={}",
            saved.getEntityType(), saved.getEntityId(), saved.getVersionNumber(), saved.getStatus());
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<EntityVersion> findLatest(WorkflowEntityType entityType, Long entityId) {
        return versionRepository.findTopByEntityTypeAndEntityIdOrderByVersionNumberDesc(
            entityType.name(), entityId);
    }

    @Transactional(readOnly = true)
    public List<EntityVersion> findAll(WorkflowEntityType entityType, Long entityId) {
        return versionRepository.findAllByEntityTypeAndEntityIdOrderByVersionNumberDesc(
            entityType.name(), entityId);
    }

    // ─── Internal JSON Diff ───────────────────────────────────────────────────

    private List<FieldDiff> computeDiff(String path, JsonNode oldNode, JsonNode newNode) {
        List<FieldDiff> diffs = new ArrayList<>();

        if (oldNode == null && newNode == null) return diffs;

        if (oldNode == null) {
            diffs.add(new FieldDiff(path, null, nodeToString(newNode), "ADDED"));
            return diffs;
        }
        if (newNode == null) {
            diffs.add(new FieldDiff(path, nodeToString(oldNode), null, "REMOVED"));
            return diffs;
        }

        if (oldNode.isObject() && newNode.isObject()) {
            // Merge all field names from both objects
            java.util.Set<String> fields = new java.util.LinkedHashSet<>();
            oldNode.fieldNames().forEachRemaining(fields::add);
            newNode.fieldNames().forEachRemaining(fields::add);

            for (String field : fields) {
                String childPath = path.isEmpty() ? field : path + "." + field;
                diffs.addAll(computeDiff(childPath, oldNode.get(field), newNode.get(field)));
            }
        } else if (oldNode.isArray() && newNode.isArray()) {
            // Arrays: compare as opaque blobs — show add/remove only
            if (!oldNode.equals(newNode)) {
                diffs.add(new FieldDiff(path, nodeToString(oldNode), nodeToString(newNode), "CHANGED"));
            }
        } else {
            // Scalar
            if (!oldNode.equals(newNode)) {
                diffs.add(new FieldDiff(path, nodeToString(oldNode), nodeToString(newNode), "CHANGED"));
            }
        }

        return diffs;
    }

    private String nodeToString(JsonNode node) {
        if (node == null || node.isNull()) return null;
        if (node.isTextual()) return node.asText();
        return node.toString();
    }

    private String serialize(Object entity) {
        try {
            return objectMapper.writeValueAsString(entity);
        } catch (Exception e) {
            throw new IllegalStateException("[VersionService] Failed to serialize entity: " + e.getMessage(), e);
        }
    }

    // ─── FieldDiff record ─────────────────────────────────────────────────────

    public record FieldDiff(
        String fieldPath,
        String oldValue,
        String newValue,
        String changeType   // ADDED | REMOVED | CHANGED
    ) {}
}
