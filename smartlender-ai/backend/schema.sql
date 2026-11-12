-- =====================================================================
-- SmartLenderAI - Enterprise Loan Prediction & Management Database Schema
-- Compatible with MySQL 8.0+ and MariaDB
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smartlender_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartlender_db;

-- 1. Users Table (Bank Officers, Loan Managers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'loan_manager', 'loan_officer') NOT NULL DEFAULT 'loan_officer',
    department VARCHAR(100) DEFAULT 'Retail Lending',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Applicant Profile Table
CREATE TABLE IF NOT EXISTS applicant_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    married ENUM('Yes', 'No') NOT NULL,
    dependents ENUM('0', '1', '2', '3+') NOT NULL DEFAULT '0',
    education ENUM('Graduate', 'Not Graduate') NOT NULL DEFAULT 'Graduate',
    self_employed ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
    applicant_income DOUBLE NOT NULL,
    coapplicant_income DOUBLE DEFAULT 0.0,
    credit_history INT NOT NULL DEFAULT 1,
    property_area ENUM('Urban', 'Semiurban', 'Rural') NOT NULL,
    address VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_applicant_code (applicant_code),
    INDEX idx_applicant_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Loan Application Table
CREATE TABLE IF NOT EXISTS loan_application (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    applicant_id INT NOT NULL,
    loan_amount DOUBLE NOT NULL COMMENT 'Loan amount requested in thousands ($K)',
    loan_amount_term INT NOT NULL DEFAULT 360 COMMENT 'Term in months',
    loan_purpose VARCHAR(100) DEFAULT 'Home Purchase',
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    officer_remarks TEXT NULL,
    review_stage VARCHAR(50) DEFAULT 'Initial Assessment',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    FOREIGN KEY (applicant_id) REFERENCES applicant_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_loan_app_num (application_number),
    INDEX idx_loan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Prediction Result Table
CREATE TABLE IF NOT EXISTS prediction_result (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    loan_id INT NULL,
    prediction_label ENUM('Approved', 'Rejected') NOT NULL,
    probability DOUBLE NOT NULL COMMENT 'Calculated probability of approval [0.0 - 1.0]',
    risk_level ENUM('Low', 'Moderate', 'High', 'Severe') NOT NULL,
    model_version VARCHAR(50) DEFAULT 'v1.4.2-prod',
    contributing_factors JSON NULL,
    final_decision ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    reviewed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicant_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loan_application(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_prediction_label (prediction_label),
    INDEX idx_pred_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Model Details Table
CREATE TABLE IF NOT EXISTS model_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(120) NOT NULL,
    version VARCHAR(50) NOT NULL UNIQUE,
    algorithm VARCHAR(120) NOT NULL,
    accuracy DOUBLE NOT NULL,
    precision_score DOUBLE NOT NULL,
    recall_score DOUBLE NOT NULL,
    f1_score DOUBLE NOT NULL,
    roc_auc DOUBLE NOT NULL,
    confusion_matrix JSON NULL,
    trained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) DEFAULT 'application',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_unread (is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(80) NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
