package com.templeregistry.dto.response.notice;

import lombok.Data;

@Data
public class NoticeAttachmentResponse {
    private Long id;
    private String originalFilename;
    private long fileSizeBytes;
    private String mimeType;
    private String downloadUrl;
    private String previewUrl;
}
