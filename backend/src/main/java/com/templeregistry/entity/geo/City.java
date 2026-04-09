package com.templeregistry.entity.geo;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "cities", indexes = {
        @Index(name = "idx_cities_state_id", columnList = "state_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE cities SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class City extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "state_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_cities_state"))
    private State state;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
