-- Migration: audit_logs_t - one row per audited business action (success or failure)
-- Date: 2026-09-18
--
-- Written by auditService.log() from the response helpers when a route is marked
-- with the audit() middleware. request_id matches the line in metrics/YYYY-MM-DD.log.
-- user_id has no foreign key on purpose: failed logins carry no user, and an audit
-- insert must never be blocked by a constraint.
--
-- An earlier, unused audit_logs_t (id/table_name/record_id/changes, 0 rows, no
-- triggers or code referencing it) is replaced by this one.

DROP TABLE IF EXISTS audit_logs_t;

CREATE TABLE audit_logs_t (
    audit_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_id    CHAR(36) NOT NULL,
    user_id       BIGINT NULL,
    action        VARCHAR(60) NOT NULL,          -- UPDATE_DISTRICT_SUCCESS / LOGIN_USER_FAILED
    module        VARCHAR(40) NOT NULL,          -- SETTINGS / AUTH / MILK-PRODUCTION ...
    entity_type   VARCHAR(40) NOT NULL,          -- DISTRICT / USER ...
    entity_id     VARCHAR(40) NULL,
    status        ENUM('SUCCESS', 'FAILED') NOT NULL,
    status_key    VARCHAR(40) NULL,              -- RESPONSE_STATUS key: UPDATED, DUPLICATE_RECORD ...
    description   VARCHAR(500) NULL,             -- the message sent to the client
    old_values    JSON NULL,                     -- row before update/delete (sensitive keys redacted)
    new_values    JSON NULL,                     -- request body for create/update (sensitive keys redacted)
    error_message VARCHAR(500) NULL,             -- failures only
    ip_address    VARCHAR(45) NULL,
    user_agent    VARCHAR(512) NULL,
    created_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_audit_user_time   (user_id, created_time),
    KEY idx_audit_entity      (entity_type, entity_id),
    KEY idx_audit_request     (request_id),
    KEY idx_audit_created     (created_time)
);
