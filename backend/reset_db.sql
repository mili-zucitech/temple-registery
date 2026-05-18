-- ============================================================================
-- COMPLETE DATABASE RESET — Temple Registry (Development Only)
-- WARNING: Destroys ALL data, tables, and Flyway history.
-- Run: mysql -h <host> -P 4000 -u <user> -p<pass> --ssl-mode=REQUIRED test < reset_db.sql
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Workflow / Clarification (deepest dependencies first) ──────────────────
DROP TABLE IF EXISTS clarification_attachments;
DROP TABLE IF EXISTS clarification_messages;
DROP TABLE IF EXISTS clarification_threads;
DROP TABLE IF EXISTS entity_versions;
DROP TABLE IF EXISTS workflow_idempotency_records;
DROP TABLE IF EXISTS workflow_transitions;
DROP TABLE IF EXISTS workflow_instances;

-- ── Notification tables ────────────────────────────────────────────────────
DROP TABLE IF EXISTS notification_action_log;
DROP TABLE IF EXISTS email_delivery_logs;
DROP TABLE IF EXISTS user_notification_preferences;
DROP TABLE IF EXISTS notification_outbox;
DROP TABLE IF EXISTS notification_rules;
DROP TABLE IF EXISTS notification_events;
DROP TABLE IF EXISTS in_app_notifications;

-- ── Audit / Governance ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS governance_action_history;
DROP TABLE IF EXISTS physical_verification_history;
DROP TABLE IF EXISTS audit_data_events;
DROP TABLE IF EXISTS audit_auth_events;
DROP TABLE IF EXISTS audit_export_events;

-- ── Temple lifecycle tables ────────────────────────────────────────────────
DROP TABLE IF EXISTS temple_timeline_events;
DROP TABLE IF EXISTS observations;
DROP TABLE IF EXISTS temple_photos;
DROP TABLE IF EXISTS temple_profile_history;
DROP TABLE IF EXISTS temple_profile_current;
DROP TABLE IF EXISTS temple_profile_staging;

-- ── Declarations ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS asset_declaration_versions;
DROP TABLE IF EXISTS declaration_clarifications;
DROP TABLE IF EXISTS asset_declarations;
DROP TABLE IF EXISTS acknowledgement_sequences;
DROP TABLE IF EXISTS physical_verification_history;

-- ── Trust / Board ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS board_member_staging;
DROP TABLE IF EXISTS board_meetings;
DROP TABLE IF EXISTS board_members;
DROP TABLE IF EXISTS trust_financials;
DROP TABLE IF EXISTS trusts;

-- ── Temple / Geo ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS document_access_logs;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS contractors;
DROP TABLE IF EXISTS temple_search_summary;
DROP TABLE IF EXISTS temples;
DROP TABLE IF EXISTS hoblis;
DROP TABLE IF EXISTS taluks;
DROP TABLE IF EXISTS districts;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;

-- ── Auth / Rate limiting ───────────────────────────────────────────────────
DROP TABLE IF EXISTS export_job_records;
DROP TABLE IF EXISTS rate_request_log;
DROP TABLE IF EXISTS idempotency_records;
DROP TABLE IF EXISTS mfa_recovery_codes;
DROP TABLE IF EXISTS refresh_tokens;

-- ── System ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS users;

-- ── Flyway history ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS flyway_schema_history;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database reset complete — all tables dropped.' AS status;
