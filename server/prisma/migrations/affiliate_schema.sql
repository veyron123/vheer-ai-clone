-- Affiliate Program Database Schema
-- This migration adds support for comprehensive affiliate/referral program

-- Table: affiliates (Partner accounts)
CREATE TABLE IF NOT EXISTS colibrrri_affiliates (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    user_id VARCHAR(30) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE, -- Unique affiliate code
    commission_rate DECIMAL(5,2) DEFAULT 20.00, -- Commission percentage
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    pending_payouts DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    payout_method VARCHAR(50), -- bank, paypal, crypto, etc
    payout_details JSON, -- Store payment details encrypted
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, pending
    tier VARCHAR(20) DEFAULT 'standard', -- For tiered commission rates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES colibrrri_users(id) ON DELETE CASCADE,
    INDEX idx_affiliate_code (code),
    INDEX idx_affiliate_status (status),
    INDEX idx_affiliate_user (user_id)
);

-- Table: affiliate_links (Custom referral links)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_links (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    affiliate_id VARCHAR(30) NOT NULL,
    alias VARCHAR(100), -- Custom alias like 'ai-logo-maker'
    url VARCHAR(500) NOT NULL, -- Full URL with parameters
    click_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_alias (alias),
    INDEX idx_link_affiliate (affiliate_id),
    INDEX idx_link_active (is_active)
);

-- Table: affiliate_clicks (Track all clicks)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_clicks (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    link_id VARCHAR(30),
    affiliate_id VARCHAR(30) NOT NULL,
    session_id VARCHAR(100), -- For tracking unique visitors
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    landing_page VARCHAR(500),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20), -- mobile, desktop, tablet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (link_id) REFERENCES colibrrri_affiliate_links(id) ON DELETE SET NULL,
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    INDEX idx_click_affiliate (affiliate_id),
    INDEX idx_click_date (created_at),
    INDEX idx_click_session (session_id)
);

-- Table: affiliate_referrals (Users brought by affiliates)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_referrals (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    affiliate_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL, -- The referred user
    link_id VARCHAR(30),
    click_id VARCHAR(30), -- Track which click led to signup
    status VARCHAR(20) DEFAULT 'signup', -- signup, trial, customer, churned
    lifetime_value DECIMAL(10,2) DEFAULT 0.00,
    first_payment_date TIMESTAMP NULL,
    last_payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    conversion_date TIMESTAMP NULL, -- When became paying customer
    
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES colibrrri_users(id) ON DELETE CASCADE,
    FOREIGN KEY (link_id) REFERENCES colibrrri_affiliate_links(id) ON DELETE SET NULL,
    FOREIGN KEY (click_id) REFERENCES colibrrri_affiliate_clicks(id) ON DELETE SET NULL,
    UNIQUE KEY unique_referral (user_id), -- One user can only be referred once
    INDEX idx_referral_affiliate (affiliate_id),
    INDEX idx_referral_status (status),
    INDEX idx_referral_date (created_at)
);

-- Table: affiliate_commissions (Track all commissions)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_commissions (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    affiliate_id VARCHAR(30) NOT NULL,
    referral_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30), -- Link to payment/subscription
    type VARCHAR(20) DEFAULT 'sale', -- sale, recurring, bonus
    amount DECIMAL(10,2) NOT NULL, -- Commission amount
    base_amount DECIMAL(10,2) NOT NULL, -- Original sale amount
    commission_rate DECIMAL(5,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
    approved_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    payout_id VARCHAR(30), -- Link to payout batch
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES colibrrri_affiliate_referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (payout_id) REFERENCES colibrrri_affiliate_payouts(id) ON DELETE SET NULL,
    INDEX idx_commission_affiliate (affiliate_id),
    INDEX idx_commission_status (status),
    INDEX idx_commission_date (created_at),
    INDEX idx_commission_payout (payout_id)
);

-- Table: affiliate_payouts (Payment batches to affiliates)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_payouts (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    affiliate_id VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL, -- bank, paypal, wise, crypto
    transaction_id VARCHAR(200), -- External transaction ID
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    notes TEXT,
    invoice_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    INDEX idx_payout_affiliate (affiliate_id),
    INDEX idx_payout_status (status),
    INDEX idx_payout_date (created_at)
);

-- Table: affiliate_tiers (Commission tiers based on performance)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_tiers (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    name VARCHAR(50) NOT NULL,
    min_sales INT DEFAULT 0,
    commission_rate DECIMAL(5,2) NOT NULL,
    bonus_rate DECIMAL(5,2) DEFAULT 0.00,
    benefits JSON, -- Additional perks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tiers
INSERT INTO colibrrri_affiliate_tiers (name, min_sales, commission_rate, bonus_rate) VALUES
('starter', 0, 20.00, 0.00),
('bronze', 5, 25.00, 0.00),
('silver', 20, 30.00, 5.00),
('gold', 50, 35.00, 10.00),
('platinum', 100, 40.00, 15.00);

-- Table: affiliate_stats_daily (Pre-aggregated daily stats for performance)
CREATE TABLE IF NOT EXISTS colibrrri_affiliate_stats_daily (
    id VARCHAR(30) PRIMARY KEY DEFAULT (cuid()),
    affiliate_id VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    clicks INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    signups INT DEFAULT 0,
    customers INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    commissions DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (affiliate_id) REFERENCES colibrrri_affiliates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_stat (affiliate_id, date),
    INDEX idx_stat_date (date),
    INDEX idx_stat_affiliate (affiliate_id)
);