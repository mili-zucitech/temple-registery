package com.templeregistry.entity.geo;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "taluks", indexes = {
        @Index(name = "idx_taluks_district_id", columnList = "district_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE taluks SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Taluk extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "district_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_taluks_district"))
    private District district;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
