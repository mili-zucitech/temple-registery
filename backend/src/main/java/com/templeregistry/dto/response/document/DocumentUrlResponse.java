package com.templeregistry.dto.response.document;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentUrlResponse {
    private Long documentId;
    private String url;
    private String expiresIn;
    private LocalDateTime generatedAt;
}
