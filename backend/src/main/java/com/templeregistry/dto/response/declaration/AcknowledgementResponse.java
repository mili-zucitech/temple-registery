package com.templeregistry.dto.response.declaration;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class AcknowledgementResponse {
    private String downloadUrl;
    private String acknowledgementNumber;
    private LocalDateTime generatedAt;
}
