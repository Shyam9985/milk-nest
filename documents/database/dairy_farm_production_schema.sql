
-- =====================================================
-- DAIRY FARM MANAGEMENT SYSTEM
-- PRODUCTION READY DATABASE SCHEMA
-- MYSQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS dairy_farm_management;
USE dairy_farm_management;

-- =====================================================
-- BRANCHES
-- =====================================================

CREATE TABLE dairy_farm_lst_t (
    dairy_farm_id BIGINT PRIMARY KEY AUTO_INCREMENT,    
    dairy_farm_code VARCHAR(50) UNIQUE NOT NULL,
    dairy_farm_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE branches_lst_t (
    branch_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dairy_farm_id BIGINT NOT NULL,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    state_id BIGINT,
    district_id BIGINT,
    mandal_id BIGINT,
    village_id BIGINT,
    street_id BIGINT,
    manager_user_id BIGINT,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1
);

ALTER TABLE branches_lst_t ADD CONSTRAINT fk_branches_dairy_farm FOREIGN KEY (dairy_farm_id) REFERENCES dairy_farm_lst_t(dairy_farm_id);

-- =====================================================
-- CATTLE TYPES MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_types_mstr_lst_t (
    cattle_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    cattle_type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- CATTLE BREEDS MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_breeds_mstr_lst_t (
    breed_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    cattle_type_id BIGINT NOT NULL,

    breed_name VARCHAR(255) NOT NULL,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_breed_cattle_type
        FOREIGN KEY (cattle_type_id)
        REFERENCES cattle_types_mstr_lst_t(cattle_type_id)
);

-- =====================================================
-- CATTLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_lst_t (
    cattle_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    branch_id BIGINT NOT NULL,

    cattle_unique_code VARCHAR(100) UNIQUE NOT NULL,

    cattle_type_id BIGINT NOT NULL,
    breed_id BIGINT NOT NULL,

    gender_id BIGINT,

    date_of_birth DATE,
    weight DECIMAL(10,2),

    color VARCHAR(100),

    purchase_date DATE,
    purchase_cost DECIMAL(12,2),

    health_status VARCHAR(255),
    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_cattle_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches_lst_t(branch_id),

    CONSTRAINT fk_cattle_type
        FOREIGN KEY (cattle_type_id)
        REFERENCES cattle_types_mstr_lst_t(cattle_type_id),

    CONSTRAINT fk_cattle_breed
        FOREIGN KEY (breed_id)
        REFERENCES cattle_breeds_mstr_lst_t(breed_id)
);

-- =====================================================
-- CATTLE HEALTH RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_health_records_lst_t (
    health_record_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    cattle_id BIGINT NOT NULL,

    checkup_date DATE NOT NULL,

    temperature DECIMAL(5,2),

    disease_name VARCHAR(255),
    symptoms TEXT,
    treatment TEXT,

    doctor_name VARCHAR(255),
    medicine_details TEXT,

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_health_cattle
        FOREIGN KEY (cattle_id)
        REFERENCES cattle_lst_t(cattle_id)
);

-- =====================================================
-- VACCINATIONS MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS vaccinations_mstr_lst_t (
    vaccination_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    vaccination_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- CATTLE VACCINATION RELATION
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_vaccinations_rel_t (
    cattle_vaccination_rel_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    cattle_id BIGINT NOT NULL,
    vaccination_id BIGINT NOT NULL,

    vaccination_date DATE NOT NULL,
    next_due_date DATE,

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_cv_cattle
        FOREIGN KEY (cattle_id)
        REFERENCES cattle_lst_t(cattle_id),

    CONSTRAINT fk_cv_vaccination
        FOREIGN KEY (vaccination_id)
        REFERENCES vaccinations_mstr_lst_t(vaccination_id)
);

-- =====================================================
-- MILK PRODUCTION
-- =====================================================

CREATE TABLE IF NOT EXISTS milk_production_lst_t (
    milk_production_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    branch_id BIGINT NOT NULL,
    cattle_id BIGINT NOT NULL,

    production_date DATE NOT NULL,

    morning_quantity DECIMAL(10,2) DEFAULT 0,
    evening_quantity DECIMAL(10,2) DEFAULT 0,

    total_quantity DECIMAL(10,2)
        GENERATED ALWAYS AS
        (morning_quantity + evening_quantity) STORED,

    fat_percentage DECIMAL(5,2),

    remarks TEXT,

    recorded_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_milk_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches_lst_t(branch_id),

    CONSTRAINT fk_milk_cattle
        FOREIGN KEY (cattle_id)
        REFERENCES cattle_lst_t(cattle_id)
);

-- =====================================================
-- PAYMENT STATUS MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_status_mstr_lst_t (
    payment_status_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    payment_status_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- MILK SALES
-- =====================================================

CREATE TABLE IF NOT EXISTS milk_sales_lst_t (
    milk_sale_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    branch_id BIGINT NOT NULL,

    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(20),

    sale_date DATE NOT NULL,

    milk_quantity DECIMAL(10,2),
    price_per_liter DECIMAL(10,2),

    total_amount DECIMAL(12,2),

    payment_status_id BIGINT,

    payment_mode VARCHAR(100),

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_sales_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches_lst_t(branch_id),

    CONSTRAINT fk_sales_payment_status
        FOREIGN KEY (payment_status_id)
        REFERENCES payment_status_mstr_lst_t(payment_status_id)
);

-- =====================================================
-- EXPENSE TYPES MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS expense_types_mstr_lst_t (
    expense_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    expense_type_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- EXPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses_lst_t (
    expense_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    branch_id BIGINT NOT NULL,
    expense_type_id BIGINT NOT NULL,

    expense_date DATE NOT NULL,

    amount DECIMAL(12,2) NOT NULL,

    description TEXT,

    bill_number VARCHAR(100),

    paid_to VARCHAR(255),

    payment_mode VARCHAR(100),

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_expense_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches_lst_t(branch_id),

    CONSTRAINT fk_expense_type
        FOREIGN KEY (expense_type_id)
        REFERENCES expense_types_mstr_lst_t(expense_type_id)
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance_lst_t (
    attendance_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    employee_id BIGINT NOT NULL,

    branch_id BIGINT NOT NULL,

    attendance_date DATE NOT NULL,

    check_in_time DATETIME,
    check_out_time DATETIME,

    attendance_status VARCHAR(50),

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- FEED TYPES MASTER
-- =====================================================

CREATE TABLE IF NOT EXISTS feed_types_mstr_lst_t (
    feed_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    feed_type_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1
);

-- =====================================================
-- CATTLE FEED MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS cattle_feed_lst_t (
    feed_record_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    branch_id BIGINT NOT NULL,

    feed_type_id BIGINT NOT NULL,

    feed_date DATE NOT NULL,

    quantity DECIMAL(10,2),

    cost DECIMAL(12,2),

    remarks TEXT,

    created_by BIGINT,

    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_by BIGINT,

    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_by BIGINT,
    deleted_time TIMESTAMP NULL,

    is_active TINYINT(1) DEFAULT 1,

    CONSTRAINT fk_feed_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches_lst_t(branch_id),

    CONSTRAINT fk_feed_type
        FOREIGN KEY (feed_type_id)
        REFERENCES feed_types_mstr_lst_t(feed_type_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_cattle_branch
ON cattle_lst_t(branch_id);

CREATE INDEX idx_milk_date
ON milk_production_lst_t(production_date);

CREATE INDEX idx_expense_date
ON expenses_lst_t(expense_date);

CREATE INDEX idx_sales_date
ON milk_sales_lst_t(sale_date);

-- =====================================================
-- DEFAULT MASTER DATA
-- =====================================================

INSERT INTO cattle_types_mstr_lst_t
(cattle_type_name)
VALUES
('Cow'),
('Buffalo');

INSERT INTO payment_status_mstr_lst_t
(payment_status_name)
VALUES
('Paid'),
('Pending'),
('Partial');

INSERT INTO expense_types_mstr_lst_t
(expense_type_name)
VALUES
('Feed'),
('Medicine'),
('Electricity'),
('Salary'),
('Transportation');

INSERT INTO feed_types_mstr_lst_t
(feed_type_name)
VALUES
('Dry Feed'),
('Green Feed'),
('Silage');
