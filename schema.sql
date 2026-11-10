-- ==============================================================================
-- RENDER POSTGRESQL SCHEMA FOR ISHAK TELEGRAM RESELLER MANAGEMENT BOT
-- Project: Ishak AI Trading Bot - Reseller Bot System
-- Owner Telegram ID: 8274806813
-- Official Channel: @trade_pilotbot
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks every user interacting with the Telegram Bot
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'owner')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    channel_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. RESELLERS TABLE
-- Details of approved resellers, unique ID, balance, and quotas
CREATE TABLE IF NOT EXISTS resellers (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    reseller_code VARCHAR(20) UNIQUE NOT NULL, -- e.g. RSL-82748
    business_name VARCHAR(150),
    contact_phone VARCHAR(50),
    balance NUMERIC(12, 2) DEFAULT 0.00 CHECK (balance >= 0.00),
    total_deposited NUMERIC(12, 2) DEFAULT 0.00 CHECK (total_deposited >= 0.00),
    total_licenses_generated INTEGER DEFAULT 0 CHECK (total_licenses_generated >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    application_note TEXT,
    approved_by BIGINT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_code ON resellers(reseller_code);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON resellers(status);

-- 3. PACKAGES TABLE
-- Dynamic License Packages managed by the Owner
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g. "Starter 20 Days", "Pro 30 Days"
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0),
    price_bdt NUMERIC(10, 2) NOT NULL CHECK (price_bdt >= 0),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENT METHODS TABLE
-- bKash, Nagad, Rocket, USDT/Binance Pay details
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- e.g. "bKash Personal", "Nagad Personal", "USDT TRC20"
    account_number VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'Personal',
    instruction TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEPOSITS TABLE
-- Manual deposit requests submitted by Resellers
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    reseller_id INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount_usd NUMERIC(10, 2) DEFAULT 0.00,
    amount_bdt NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'BDT' CHECK (currency IN ('BDT', 'USD')),
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- Prevents duplicate submission
    sender_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    admin_note TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_tx ON deposits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_reseller ON deposits(reseller_id);

-- 6. TRANSACTIONS TABLE
-- Immutable financial ledger for all balance changes
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    reseller_id INTEGER NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('deposit', 'license_purchase', 'admin_adjustment', 'refund', 'manual_deduct')),
    amount NUMERIC(12, 2) NOT NULL, -- Positive for credit, negative for debit
    currency VARCHAR(10) DEFAULT 'BDT',
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(100), -- deposit_id, license_key, or admin_action_id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_reseller ON transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 7. BOT SETTINGS TABLE
-- Key-value configurations for the bot (maintenance mode, minimum deposit, etc.)
CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ACTIVITY LOGS & AUDIT TRAIL
-- Comprehensive audit logging for security and compliance
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_or_source VARCHAR(100) DEFAULT 'telegram_bot',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(telegram_id);

-- 9. DEVICE RESET AUDIT LOGS
CREATE TABLE IF NOT EXISTS device_reset_logs (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(100) NOT NULL,
    reseller_id INTEGER REFERENCES resellers(id) ON DELETE SET NULL,
    telegram_id BIGINT NOT NULL,
    previous_device_id TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BROADCAST LOGS
CREATE TABLE IF NOT EXISTS broadcast_logs (
    id SERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    target_group VARCHAR(50) DEFAULT 'all', -- 'all', 'resellers', 'users'
    message TEXT NOT NULL,
    total_targeted INTEGER DEFAULT 0,
    successful_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INITIAL DEFAULT DATA SEEDING
-- ==============================================================================

-- Default Packages (as requested)
INSERT INTO packages (name, duration_days, price_usd, price_bdt, description, is_active)
VALUES 
    ('Starter Plan (20 Days)', 20, 4.00, 500.00, '20 Days License Key with 1 Device Binding', TRUE),
    ('Standard Plan (30 Days)', 30, 6.00, 750.00, '30 Days License Key with 1 Device Binding', TRUE),
    ('Pro Plan (45 Days)', 45, 8.00, 1000.00, '45 Days License Key with 1 Device Binding', TRUE),
    ('Elite Plan (60 Days)', 60, 14.00, 1750.00, '60 Days License Key with 2 Device Resets Allowed', TRUE)
ON CONFLICT DO NOTHING;

-- Default Payment Methods
INSERT INTO payment_methods (name, account_number, account_type, instruction, display_order, is_active)
VALUES
    ('bKash Personal', '018XXXXXXXX', 'Personal (Send Money)', 'bKash App থেকে Send Money করুন এবং TrxID প্রদান করুন।', 1, TRUE),
    ('Nagad Personal', '018XXXXXXXX', 'Personal (Send Money)', 'Nagad App থেকে Send Money করুন এবং TrxID প্রদান করুন।', 2, TRUE),
    ('Rocket Personal', '018XXXXXXXX', 'Personal (Send Money)', 'Rocket App থেকে Send Money করুন এবং TrxID প্রদান করুন।', 3, TRUE),
    ('Binance Pay / USDT', 'PAY_ID_HERE', 'Binance Pay / USDT TRC20', 'Send exact USDT and provide Payment Order ID / TxHash.', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Default Bot Settings
INSERT INTO bot_settings (setting_key, setting_value, description)
VALUES
    ('maintenance_mode', 'false', 'Enable or disable maintenance mode for non-owners'),
    ('official_channel', '@trade_pilotbot', 'Required official Telegram channel for verification'),
    ('owner_id', '8274806813', 'Primary Owner Telegram ID'),
    ('support_username', '@IshakVhai', 'Official Support Contact Username'),
    ('min_deposit_bdt', '500', 'Minimum deposit amount in BDT'),
    ('currency_mode', 'BDT', 'Default currency for resellers (BDT or USD)')
ON CONFLICT (setting_key) DO NOTHING;
