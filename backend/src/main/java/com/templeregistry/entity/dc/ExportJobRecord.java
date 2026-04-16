package com.templeregistry.entity.dc;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "export_job_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportJobRecord {

    @Id
    @Column(name = "job_id", nullable = false, length = 64)
    private String jobId;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Column(name = "district_id")
    private Long districtId;

    @Column(name = "format", length = 10)
    private String format;  // "CSV" or "PDF"

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}

