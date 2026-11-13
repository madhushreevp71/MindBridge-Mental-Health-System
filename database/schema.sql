
-- MindBridge database schema (MySQL 8 / MariaDB 10.5+)
-- Run with: npm run db:setup
-- Or paste this file into MySQL Workbench

CREATE DATABASE IF NOT EXISTS mindbridge
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mindbridge;

-- ---------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('student','doctor','admin') NOT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email_role (email, role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Doctor Profiles
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doctor_profiles (
  user_id             CHAR(36)     NOT NULL PRIMARY KEY,
  license_number      VARCHAR(80)  NOT NULL,
  license_authority   VARCHAR(160) NOT NULL,
  specialization      VARCHAR(120) NOT NULL,
  npi_number          VARCHAR(10)  NULL,
  verification_status ENUM('pending','approved','rejected')
                      NOT NULL DEFAULT 'pending',
  verification_notes  VARCHAR(500) NULL,
  verified_at         TIMESTAMP    NULL,
  verified_by         CHAR(36)     NULL,
  CONSTRAINT fk_doctor_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Student Wellbeing Data
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mood_entries (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    CHAR(36)        NOT NULL,
  score      TINYINT UNSIGNED NOT NULL,
  tags       VARCHAR(255)    NOT NULL DEFAULT '',
  note       VARCHAR(500)    NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_mood_user_date (user_id, created_at),

  CONSTRAINT fk_mood_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  -- NEW: Mood score must be between 0 and 100
  CONSTRAINT chk_mood_score
    CHECK (score <= 100)

) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assessments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     CHAR(36)        NOT NULL,
  phq_score   TINYINT UNSIGNED NOT NULL,
  gad_score   TINYINT UNSIGNED NOT NULL,
  total_score TINYINT UNSIGNED NOT NULL,
  severity    ENUM('mild','moderate','severe') NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_assess_user_date (user_id, created_at),

  CONSTRAINT fk_assess_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  -- NEW: Validate PHQ score
  CONSTRAINT chk_phq_score
    CHECK (phq_score <= 12),

  -- NEW: Validate GAD score
  CONSTRAINT chk_gad_score
    CHECK (gad_score <= 12),

  -- NEW: Validate total assessment score
  CONSTRAINT chk_total_score
    CHECK (total_score <= 24)

) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reminders (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  text       VARCHAR(200) NOT NULL,
  done       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_reminders_user (user_id),

  CONSTRAINT fk_reminder_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Chat Messages
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    CHAR(36)        NOT NULL,
  sender     ENUM('user','bot') NOT NULL,
  body       TEXT            NOT NULL,
  sentiment  VARCHAR(20)     NULL,
  is_crisis  TINYINT(1)      NOT NULL DEFAULT 0,
  source     VARCHAR(12)     NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_chat_user (user_id, id),

  CONSTRAINT fk_chat_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS appointments (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  student_id CHAR(36)     NOT NULL,
  doctor_id  CHAR(36)     NOT NULL,
  appt_date  DATE         NOT NULL,
  appt_time  VARCHAR(8)   NOT NULL DEFAULT '',
  reason     VARCHAR(500) NOT NULL DEFAULT '',
  status     ENUM('requested','accepted','pending','rejected','cancelled')
             NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_appt_student (student_id),
  KEY idx_appt_doctor_date (doctor_id, appt_date),

  CONSTRAINT fk_appt_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_appt_doctor
    FOREIGN KEY (doctor_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  title      VARCHAR(160) NOT NULL,
  message    VARCHAR(600) NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_notif_user (user_id, created_at),

  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
