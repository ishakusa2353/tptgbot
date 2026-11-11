/**
 * ==============================================================================
 * TRADEPILOT TELEGRAM RESELLER MANAGEMENT BOT - ENGINE (v3.2)
 * Real-time Supabase sync, Copyable Delivery format, Filtered Licenses & Block/Unblock/Delete
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

export const BOT_CONFIG = {
  TOKEN: process.env.TELEGRAM_BOT_TOKEN || '9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ',
  OWNER_ID: 8274806813,
  OFFICIAL_CHANNEL: process.env.OFFICIAL_CHANNEL || '@trade_pilotbot',
  SUPPORT_USERNAME: process.env.SUPPORT_USERNAME || '@IshakVhai',
  BKASH_NUMBER: process.env.BKASH_NUMBER || '01606398924',
  BINANCE_PAY_ID: process.env.BINANCE_PAY_ID || '827480681',
  SUPABASE_URL: 'https://qbazzarqiplrqqfytajz.supabase.co',
  SUPABASE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo',
};

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_CONFIG.TOKEN}`;
export const supabase = createClient(BOT_CONFIG.SUPABASE_URL, BOT_CONFIG.SUPABASE_KEY);

export interface ResellerAccount {
  id: number;
  telegram_id: number;
  username: string;
  reseller_code: string;
  business_name: string;
  balance: number;
  total_deposited: number;
  total_licenses: number;
  status: 'active' | 'suspended';
  created_at: Date;
}

export interface DepositRecord {
  id: number;
  telegram_id: number;
  reseller_code: string;
  method: string;
  amount: number;
  transaction_id: string;
  sender: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

export const botMemory = {
  users: new Map<number, any>(),
  resellers: new Map<number, ResellerAccount>(),
  deposits: new Map<number, DepositRecord>(),
  userStates: new Map<number, any>(),
  paymentSettings: {
    bkash: BOT_CONFIG.BKASH_NUMBER,
    binancePayId: BOT_CONFIG.BINANCE_PAY_ID,
  },
  packages: [
    { id: 1, name: 'Starter Plan (20 Days)', duration_days: 20, duration_code: '20d', price_usd: 4.0, price_bdt: 500.0 },
    { id: 2, name: 'Standard Plan (30 Days)', duration_days: 30, duration_code: '30d', price_usd: 6.0, price_bdt: 750.0 },
    { id: 3, name: 'Pro Plan (45 Days)', duration_days: 45, duration_code: '45d', price_usd: 8.0, price_bdt: 1000.0 },
    { id: 4, name: 'Elite Plan (60 Days)', duration_days: 60, duration_code: '60d', price_usd: 14.0, price_bdt: 1750.0 },
  ],
};

// Seed Master Reseller for Owner
botMemory.resellers.set(BOT_CONFIG.OWNER_ID, {
  id: 1,
  telegram_id: BOT_CONFIG.OWNER_ID,
  username: 'IshakVhai',
  reseller_code: 'TP-RSL-OWNER',
  business_name: 'Ishak Master Admin',
  balance: 100000.0,
  total_deposited: 100000.0,
  total_licenses: 10,
  status: 'active',
  created_at: new Date(),
});

// Helper: generate key
export function generateVipKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TP-VIP-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

// Polling stub for local dev (polling runs on Render, so this is safe and does not conflict)
export async function startBotPolling() {
  console.log('ℹ️ Local bot polling idle. Live polling is handled on Render.');
}

export function stopBotPolling() {}
