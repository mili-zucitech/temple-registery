-- V55: Notification Router Infrastructure
-- Replaces: NotificationHelper (god class), NotificationEventPublisherImpl (legacy)

CREATE TABLE IF NOT EXISTS notification_rules (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    event_type      VARCHAR(40) NOT NULL,
    entity_type     VARCHAR(40) NOT NULL COMMENT '* = all modules',
    action          VARCHAR(40) NOT NULL,
    recipient_type  VARCHAR(20) NOT NULL COMMENT 'TA | DC | ADMIN',
    channel         VARCHAR(20) NOT NULL COMMENT 'IN_APP | EMAIL | BOTH',
    priority        VARCHAR(10) NOT NULL COMMENT 'LOW | MEDIUM | HIGH | CRITICAL',
    template_key    VARCHAR(100) NOT NULL,
    enabled         TINYINT(1)  NOT NULL DEFAULT 1,
    description     VARCHAR(500) NULL,
    is_deleted      TINYINT(1)  NOT NULL DEFAULT 0,
    created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
    created_by      BIGINT      NOT NULL DEFAULT 0,
    updated_by      BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_nr_event_action (event_type, action),
    INDEX idx_nr_entity_type (entity_type),
    INDEX idx_nr_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_outbox (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    event_payload_json  JSON        NOT NULL,
    workflow_instance_id BIGINT     NULL,
    event_type          VARCHAR(40) NOT NULL,
    dispatch_status     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at_instant  DATETIME(6) NOT NULL,
    dispatched_at       DATETIME(6) NULL,
    retry_count         INT         NOT NULL DEFAULT 0,
    last_error          TEXT        NULL,
    is_deleted          TINYINT(1)  NOT NULL DEFAULT 0,
    created_at          DATETIME(6) NOT NULL DEFAULT NOW(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT NOW(6),
    created_by          BIGINT      NOT NULL DEFAULT 0,
    updated_by          BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_no_status_created (dispatch_status, created_at_instant),
    INDEX idx_no_workflow_instance_id (workflow_instance_id),
    INDEX idx_no_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed canonical notification rules
INSERT INTO notification_rules (event_type, entity_type, action, recipient_type, channel, priority, template_key, description, created_by, updated_by) VALUES
('WORKFLOW_TRANSITION','*','SUBMIT',                'DC','BOTH','MEDIUM','submission-notification',          'Notify DC on any TA submission',0,0),
('WORKFLOW_TRANSITION','*','APPROVE',               'TA','BOTH','HIGH',  'approval-notification',            'Notify TA on DC approval',0,0),
('WORKFLOW_TRANSITION','*','RE_APPROVE',            'TA','BOTH','HIGH',  'approval-notification',            'Notify TA on DC re-approval',0,0),
('WORKFLOW_TRANSITION','*','REJECT',                'TA','BOTH','HIGH',  'rejection-notification',           'Notify TA on DC rejection',0,0),
('WORKFLOW_TRANSITION','*','REQUEST_CLARIFICATION', 'TA','BOTH','HIGH',  'clarification-request',            'Notify TA on clarification request',0,0),
('WORKFLOW_TRANSITION','*','RESPOND_CLARIFICATION', 'DC','BOTH','MEDIUM','clarification-response',           'Notify DC on TA clarification response',0,0),
('WORKFLOW_TRANSITION','*','RESUBMIT',              'DC','BOTH','MEDIUM','resubmission-notification',        'Notify DC on TA resubmission',0,0),
('WORKFLOW_TRANSITION','*','EDIT_APPROVED',         'DC','IN_APP','MEDIUM','edit-after-approval-notification','Notify DC on TA edit of approved record',0,0),
('WORKFLOW_TRANSITION','*','BEGIN_REVIEW',          'TA','IN_APP','LOW', 'review-started-notification',     'Notify TA when DC opens record for review',0,0),
('SYSTEM','DECLARATION', 'FLAG_OVERDUE',            'TA','BOTH','HIGH',  'overdue-notification',             'Notify TA on declaration overdue',0,0),
('WORKFLOW_TRANSITION','*','WITHDRAW',              'DC','IN_APP','LOW', 'withdrawal-notification',          'Notify DC on TA withdrawal',0,0);
