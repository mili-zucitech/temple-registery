package com.templeregistry.service.governance;

import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;

/**
 * Resolves a canonical {@link GovernanceStatusPayload} for any governed entity.
 *
 * Always reads from {@link WorkflowInstance#getStatus()} — never from legacy entity fields.
 * Call from service methods that build governed-module responses (TrustResponse, DeclarationResponse, etc.).
 *
 * Governance scope: TRUST, DECLARATION, TEMPLE_PROFILE only.
 * Employee and Contractor are administrative-only and must never be passed to this resolver.
 */
public interface GovernanceStatusResolver {

    /**
     * Resolve canonical status for a governed entity by (entityType, entityId).
     * Makes one DB lookup to find the WorkflowInstance.
     *
     * @param entityType TRUST, DECLARATION, or TEMPLE_PROFILE
     * @param entityId   domain entity PK
     * @return canonical payload, never null (returns UNKNOWN payload when WorkflowInstance absent)
     */
    GovernanceStatusPayload resolve(WorkflowEntityType entityType, Long entityId);

    /**
     * Resolve from an already-loaded WorkflowInstance.
     * Preferred when the caller already has the instance in memory to avoid a second DB lookup.
     *
     * @param instance the loaded WorkflowInstance
     * @return canonical payload, never null
     */
    GovernanceStatusPayload resolveFromInstance(WorkflowInstance instance);
}
