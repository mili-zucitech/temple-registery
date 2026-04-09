package com.templeregistry.entity.declaration;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "asset_declarations", indexes = {
        @Index(name = "idx_decl_temple_id", columnList = "temple_id"),
        @Index(name = "idx_decl_status",     columnList = "status"),
        @Index(name = "idx_decl_district_id",columnList = "district_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE asset_declarations SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AssetDeclaration extends BaseEntity {

    @Version
    @Column(name = "version") private Long version;

    @Column(name = "temple_id", nullable = false) private Long templeId;
    @Column(name = "district_id", nullable = false) private Long districtId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40) private DeclarationStatus status = DeclarationStatus.DRAFT;

    // Immovable Assets
    @Column(name = "agricultural_land_acres", precision = 12, scale = 4) private BigDecimal agriculturalLandAcres;
    @Column(name = "agricultural_land_value", precision = 18, scale = 2) private BigDecimal agriculturalLandValue;
    @Column(name = "buildings_sqft", precision = 12, scale = 2) private BigDecimal buildingsSqft;
    @Column(name = "buildings_value", precision = 18, scale = 2) private BigDecimal buildingsValue;
    @Column(name = "leased_properties_count") private Integer leasedPropertiesCount;
    @Column(name = "leased_properties_value", precision = 18, scale = 2) private BigDecimal leasedPropertiesValue;
    @Column(name = "other_land_value", precision = 18, scale = 2) private BigDecimal otherLandValue;

    // Movable Assets
    @Column(name = "gold_grams", precision = 12, scale = 3) private BigDecimal goldGrams;
    @Column(name = "silver_grams", precision = 12, scale = 3) private BigDecimal silverGrams;
    @Column(name = "idols_count") private Integer idolsCount;
    @Column(name = "vehicles_count") private Integer vehiclesCount;
    @Column(name = "financial_assets_value", precision = 18, scale = 2) private BigDecimal financialAssetsValue;
    @Column(name = "other_movable_value", precision = 18, scale = 2) private BigDecimal otherMovableValue;

    // Workflow timestamps
    @Column(name = "submitted_at") private LocalDateTime submittedAt;
    @Column(name = "reviewed_at") private LocalDateTime reviewedAt;
    @Column(name = "reviewed_by") private Long reviewedBy;

    // Acknowledgement
    @Column(name = "acknowledgement_number", length = 50) private String acknowledgementNumber;

    @Column(name = "due_date") private java.time.LocalDate dueDate;
}
