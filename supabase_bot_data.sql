-- ==============================================================================
-- TRADEPILOT RESELLER BOT - ALL-IN-ONE SUPABASE DATA TABLE
-- Database: Supabase PostgreSQL (qbazzarqiplrqqfytajz.supabase.co)
-- Table Name: ishak_bot_data
-- Purpose: Permanently stores all Resellers, Balances, Deposits, Settings & Logs
-- ==============================================================================

-- 1. Create the Unified Bot Data Table
CREATE TABLE IF NOT EXISTS public.ishak_bot_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                         -- 'reseller', 'deposit', 'settings', 'log'
    telegram_id BIGINT,                         -- Telegram Chat/User ID for fast lookups
    data JSONB NOT NULL DEFAULT '{}'::jsonb,    -- Complete entity attributes as JSON
    created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 2. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_ishak_bot_data_type ON public.ishak_bot_data (type);
CREATE INDEX IF NOT EXISTS idx_ishak_bot_data_tgid ON public.ishak_bot_data (telegram_id);
CREATE INDEX IF NOT EXISTS idx_ishak_bot_data_updated ON public.ishak_bot_data (updated_at DESC);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.ishak_bot_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if re-running
DROP POLICY IF EXISTS "Allow public all access on ishak_bot_data" ON public.ishak_bot_data;

-- Grant Full Read/Write Access to the Public Anon Role for Telegram Bot Operations
CREATE POLICY "Allow public all access on ishak_bot_data"
ON public.ishak_bot_data
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Initial Master Reseller (Owner 8274806813) Seed
INSERT INTO public.ishak_bot_data (id, type, telegram_id, data, updated_at)
VALUES (
    'reseller:8274806813',
    'reseller',
    8274806813,
    '{
        "id": 1,
        "telegram_id": 8274806813,
        "username": "IshakVhai",
        "reseller_code": "TP-RSL-OWNER",
        "business_name": "Ishak Master Admin",
        "balance": 100000.0,
        "total_deposited": 100000.0,
        "total_licenses": 10,
        "status": "active"
    }'::jsonb,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
ON CONFLICT (id) DO UPDATE 
SET updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

-- 5. Initial Payment Gateway Settings Seed
INSERT INTO public.ishak_bot_data (id, type, telegram_id, data, updated_at)
VALUES (
    'settings:payment',
    'settings',
    8274806813,
    '{
        "bkash": "01606398924",
        "binancePayId": "827480681"
    }'::jsonb,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
)
ON CONFLICT (id) DO UPDATE 
SET updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
