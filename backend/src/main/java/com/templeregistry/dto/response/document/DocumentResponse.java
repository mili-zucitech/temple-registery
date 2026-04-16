package com.templeregistry.dto.response.document;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentResponse {
    private Long id;
    private String ownerType;
    private Long ownerId;
    private String originalFilename;
    private String mimeType;
    private Long fileSizeBytes;
    private String documentLabel;
    private LocalDateTime createdAt;
}
