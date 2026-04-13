package com.templeregistry.entity.declaration;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Immutable historical version snapshots of AssetDeclaration submissions.
 * Appended whenever a declaration is submitted or resubmitted.
 */
@Entity
@Table(name = "asset_declaration_versions", indexes = {
        @Index(name = "idx_decl_version_decl_id", columnList = "declaration_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE asset_declaration_versions SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class AssetDeclarationVersion extends BaseEntity {

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "snapshot_json", columnDefinition = "JSON", nullable = false)
    private String snapshotJson;

    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;
}
