package com.templeregistry.entity.workflow;

/**
 * Registry of all governable entity types.
 *
 * Adding a new governable module = add an entry here + seed workflow_instance rows.
 * No new tables, no new service classes, no new status enums needed.
 */
public enum WorkflowEntityType {

    /** TempleProfileStaging record. */
    TEMPLE_PROFILE,

    /** AssetDeclaration record. */
    DECLARATION,

    /** Trust record (entire trust including board members). */
    TRUST,

    /**
     * Individual BoardMember record.
     * Note: board member versioning is managed via parent Trust snapshot.
     * Individual board member workflow is governed independently.
     */
    BOARD_MEMBER
}
