package com.templeregistry.entity.declaration;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "declaration_clarifications", indexes = {
        @Index(name = "idx_clarif_decl_id", columnList = "declaration_id")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclarationClarification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false) private Long declarationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 20) private ClarificationDirection direction;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT") private String message;

    @Column(name = "author_id", nullable = false) private Long authorId;

    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }
}
