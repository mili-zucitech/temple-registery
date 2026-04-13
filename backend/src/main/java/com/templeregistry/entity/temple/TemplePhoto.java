package com.templeregistry.entity.temple;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "temple_photos")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class TemplePhoto extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "temple_id", nullable = false)
    private Temple temple;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Builder.Default
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Column(name = "display_order")
    private Integer displayOrder;
}