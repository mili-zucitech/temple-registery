-- Export job ownership tracking for secure downloads.
-- Additive migration (non-breaking): enables server-side authorization for /dc/export/{jobId}/download.

CREATE TABLE IF NOT EXISTS export_job_records (
  job_id        VARCHAR(64)  NOT NULL,
  actor_user_id BIGINT       NOT NULL,
  district_id   BIGINT       DEFAULT NULL,
  created_at    DATETIME(6)  NOT NULL DEFAULT NOW(6),
  expires_at    DATETIME(6)  NOT NULL,
  PRIMARY KEY (job_id),
  INDEX idx_export_job_actor (actor_user_id),
  INDEX idx_export_job_expires (expires_at),
  CONSTRAINT fk_export_job_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

