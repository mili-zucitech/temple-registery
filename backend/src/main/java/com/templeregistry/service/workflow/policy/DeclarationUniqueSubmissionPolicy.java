package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import com.templeregistry.service.workflow.WorkflowPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Policy: A temple may only submit one Declaration per financial year
 * while another declaration for the same temple+year is still in a pending state.
 *
 * Prevents duplicate active declarations for the same financial year.
 * The financialYear is stored in workflow_instance.metadata_json.
 */
@Component
@RequiredArgsConstructor
public class DeclarationUniqueSubmissionPolicy implements WorkflowPolicy {

    private final WorkflowInstanceRepository instanceRepo;

    @Override
    public String entityType() {
        return "DECLARATION";
    }

    @Override
    public WorkflowAction action() {
        return WorkflowAction.SUBMIT;
    }

    @Override
    public PolicyResult evaluate(WorkflowInstance instance, ActionContext context) {
        // Extract financialYear from this instance's metadata
        String metadata = instance.getMetadataJson();
        if (metadata == null || !metadata.contains("financialYear")) {
            return PolicyResult.allow(); // no year metadata — skip check
        }

        // Check if any other DECLARATION for this temple with same year is already pending
        var pendingInstances = instanceRepo.findByTempleIdAndEntityType(
            instance.getTempleId(),
            com.templeregistry.entity.workflow.WorkflowEntityType.DECLARATION
        );

        boolean hasDuplicate = pendingInstances.stream()
            .filter(wi -> !wi.getId().equals(instance.getId()))
            .filter(wi -> wi.isPendingDcAction())
            .anyMatch(wi -> metadata.equals(wi.getMetadataJson()));

        if (hasDuplicate) {
            return PolicyResult.deny(
                "A declaration for this financial year is already pending review. " +
                "Wait for the current declaration to be processed before submitting a new one."
            );
        }

        return PolicyResult.allow();
    }
}
