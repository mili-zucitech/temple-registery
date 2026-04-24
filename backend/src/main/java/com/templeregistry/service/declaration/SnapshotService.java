package com.templeregistry.service.declaration;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.AssetDeclarationVersion;

/**
 * Captures immutable JSON snapshots of asset declarations at key workflow events.
 * Each call increments the declaration's versionNumber and persists an AssetDeclarationVersion record.
 */
public interface SnapshotService {

    /**
     * Captures a full JSON snapshot of the declaration and all asset sub-tables,
     * increments version_number, and persists an AssetDeclarationVersion record.
     *
     * @param declaration the declaration to snapshot (must be saved first)
     * @param actorId     the user ID triggering the snapshot
     * @return the persisted AssetDeclarationVersion
     */
    AssetDeclarationVersion capture(AssetDeclaration declaration, Long actorId);
}
