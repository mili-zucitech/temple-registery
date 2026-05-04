package com.templeregistry.dto.response.temple;

import java.time.LocalDateTime;

public class TemplePhotoDto {
    private Long id;
    private String url;
    private boolean primary;
    private String fileName;
    private LocalDateTime uploadDate;
    private Integer width;
    private Integer height;

    public TemplePhotoDto(Long id, String url, boolean primary, String fileName, LocalDateTime uploadDate, Integer width, Integer height) {
        this.id = id;
        this.url = url;
        this.primary = primary;
        this.fileName = fileName;
        this.uploadDate = uploadDate;
        this.width = width;
        this.height = height;
    }

    public Long getId() {
        return id;
    }

    public String getUrl() {
        return url;
    }

    public boolean isPrimary() {
        return primary;
    }

    public String getFileName() {
        return fileName;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }
}
