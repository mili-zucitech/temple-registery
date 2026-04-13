package com.templeregistry.entity.geo;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "hoblis", indexes = {
        @Index(name = "idx_hoblis_taluk_id", columnList = "taluk_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE hoblis SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Hobli extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "taluk_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_hoblis_taluk"))
    private Taluk taluk;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
