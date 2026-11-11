/**
 * ==============================================================================
 * TRADEPILOT TELEGRAM RESELLER MANAGEMENT BOT - CORE ENGINE (v4.0)
 * All-In-One Supabase Persistence:
 * 1. Licenses stored in 'ishak_licenses'
 * 2. Resellers, Balances, Deposits & Settings stored in 'ishak_bot_data'
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
  created_at: string | Date;
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
  created_at: string | Date;
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

// Seed Master Reseller for Owner in memory initially
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
  created_at: new Date().toISOString(),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==============================================================================
// 1. SUPABASE ALL-IN-ONE DATA SYNC & PERSISTENCE (ishak_bot_data)
// ==============================================================================

export async function syncFromSupabase() {
  try {
    const { data, error } = await supabase.from('ishak_bot_data').select('*');
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
        console.warn('⚠️ Supabase Notice: ishak_bot_data table not created yet in Supabase.');
        console.warn('👉 Please run supabase_bot_data.sql in Supabase SQL Editor to enable persistent bot storage.');
      } else {
        console.warn('Supabase sync warning:', error.message);
      }
      return;
    }

    if (data && Array.isArray(data)) {
      let rCount = 0;
      let dCount = 0;

      for (const row of data) {
        if (row.type === 'reseller' && row.data) {
          const r = row.data;
          const tgId = Number(row.telegram_id || r.telegram_id);
          botMemory.resellers.set(tgId, {
            id: r.id || tgId,
            telegram_id: tgId,
            username: r.username || '',
            reseller_code: r.reseller_code || `TP-RSL-${tgId}`,
            business_name: r.business_name || '',
            balance: Number(r.balance) || 0,
            total_deposited: Number(r.total_deposited) || 0,
            total_licenses: Number(r.total_licenses) || 0,
            status: r.status || 'active',
            created_at: r.created_at || new Date().toISOString(),
          });
          rCount++;
        } else if (row.type === 'deposit' && row.data) {
          const d = row.data;
          const depId = Number(d.id || row.id.replace('deposit:', ''));
          botMemory.deposits.set(depId, {
            id: depId,
            telegram_id: Number(row.telegram_id || d.telegram_id),
            reseller_code: d.reseller_code || '',
            method: d.method || 'bKash Personal',
            amount: Number(d.amount) || 0,
            transaction_id: d.transaction_id || '',
            sender: d.sender || '',
            status: d.status || 'pending',
            created_at: d.created_at || new Date().toISOString(),
          });
          dCount++;
        } else if (row.type === 'settings' && row.data) {
          if (row.data.bkash) botMemory.paymentSettings.bkash = row.data.bkash;
          if (row.data.binancePayId) botMemory.paymentSettings.binancePayId = row.data.binancePayId;
        }
      }

      console.log(`✅ Synced with Supabase ishak_bot_data (${rCount} resellers, ${dCount} deposits).`);
    }
  } catch (err: any) {
    console.warn('Supabase sync error:', err.message);
  }
}

export async function saveResellerToSupabase(reseller: ResellerAccount) {
  botMemory.resellers.set(reseller.telegram_id, reseller);
  try {
    await supabase.from('ishak_bot_data').upsert({
      id: `reseller:${reseller.telegram_id}`,
      type: 'reseller',
      telegram_id: reseller.telegram_id,
      data: reseller,
      updated_at: Date.now(),
    });
  } catch (err: any) {
    console.warn('saveResellerToSupabase error:', err.message);
  }
}

export async function removeResellerFromSupabase(telegramId: number) {
  botMemory.resellers.delete(telegramId);
  try {
    await supabase.from('ishak_bot_data').delete().eq('id', `reseller:${telegramId}`);
  } catch (err: any) {
    console.warn('removeResellerFromSupabase error:', err.message);
  }
}

export async function saveDepositToSupabase(deposit: DepositRecord) {
  botMemory.deposits.set(deposit.id, deposit);
  try {
    await supabase.from('ishak_bot_data').upsert({
      id: `deposit:${deposit.id}`,
      type: 'deposit',
      telegram_id: deposit.telegram_id,
      data: deposit,
      updated_at: Date.now(),
    });
  } catch (err: any) {
    console.warn('saveDepositToSupabase error:', err.message);
  }
}

export async function saveSettingsToSupabase(settings: { bkash: string; binancePayId: string }) {
  botMemory.paymentSettings = settings;
  try {
    await supabase.from('ishak_bot_data').upsert({
      id: 'settings:payment',
      type: 'settings',
      telegram_id: BOT_CONFIG.OWNER_ID,
      data: settings,
      updated_at: Date.now(),
    });
  } catch (err: any) {
    console.warn('saveSettingsToSupabase error:', err.message);
  }
}

// ==============================================================================
// 2. TELEGRAM API HELPERS
// ==============================================================================

export async function tgCall(method: string, payload: any = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    console.error(`Telegram API Error (${method}):`, err.message);
    return { ok: false, description: err.message };
  }
}

export async function sendTgMessage(chatId: number | string, text: string, replyMarkup: any = null) {
  const payload: any = {
    chat_id: chatId.toString(),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tgCall('sendMessage', payload);
}

export async function editTgMessage(chatId: number | string, messageId: number, text: string, replyMarkup: any = null) {
  const payload: any = {
    chat_id: chatId.toString(),
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tgCall('editMessageText', payload);
}

export async function answerCallback(queryId: string, text: string = '', showAlert: boolean = false) {
  return await tgCall('answerCallbackQuery', {
    callback_query_id: queryId,
    text,
    show_alert: showAlert,
  });
}

// Channel membership check
export async function checkChannelMembership(userId: number) {
  if (userId === BOT_CONFIG.OWNER_ID) return true;
  try {
    const res = await tgCall('getChatMember', {
      chat_id: BOT_CONFIG.OFFICIAL_CHANNEL,
      user_id: userId.toString(),
    });
    if (res.ok && res.result) {
      const s = res.result.status;
      return ['creator', 'administrator', 'member', 'restricted'].includes(s);
    }
  } catch (e: any) {
    console.warn('Channel check error:', e.message);
  }
  return true;
}

// ==============================================================================
// 3. KEYBOARDS (NO DUPLICATE INLINES)
// ==============================================================================

export function getResellerReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '🔑 Generate VIP License' }, { text: '💳 My Balance' }],
      [{ text: '📜 My Licenses' }, { text: '💵 Deposit Request' }],
      [{ text: '🔄 Device Reset' }, { text: '💬 Support' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function getOwnerReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '👑 Owner Admin Panel' }, { text: '👥 Manage Resellers' }],
      [{ text: '➕ Add Reseller' }, { text: '➖ Remove Reseller' }],
      [{ text: '💰 Deposit Requests' }, { text: '🔑 License Manager' }],
      [{ text: '📊 Bot Statistics' }, { text: '⚙️ Payment Settings' }],
      [{ text: '📢 Broadcast' }, { text: '💬 Support' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

// ==============================================================================
// 4. SUPABASE LICENSE GENERATOR ('ishak_licenses')
// ==============================================================================

export function generateVipKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TP-VIP-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export async function createSupabaseVipLicense({ durationDays, durationCode, resellerCode }: any) {
  const key = generateVipKey();
  const now = Date.now();
  const durationMs = durationDays * 86400 * 1000;

  try {
    const { data, error } = await supabase
      .from('ishak_licenses')
      .insert([
        {
          key,
          active: true,
          tier: 'VIP',
          duration: durationCode,
          duration_ms: durationMs,
          exp: null,
          first_login_at: null,
          device_id: null,
          trader_id: '',
          created_at: now,
          last_used_at: null,
          note: `[DEV_LIMIT:1] Reseller: ${resellerCode}`,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase VIP license insert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, license: data || { key, duration: durationCode, duration_days: durationDays } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ==============================================================================
// 5. MESSAGE DISPATCHER
// ==============================================================================

export async function onMessage(msg: any) {
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text ? msg.text.trim() : '';

  botMemory.users.set(userId, {
    telegram_id: userId,
    first_name: msg.from.first_name || '',
    username: msg.from.username || '',
    updated_at: new Date(),
  });

  const state = botMemory.userStates.get(userId);
  if (state) {
    await handleState(userId, chatId, text, state);
    return;
  }

  // Channel Membership Check
  const isMember = await checkChannelMembership(userId);
  if (!isMember && userId !== BOT_CONFIG.OWNER_ID) {
    await sendTgMessage(
      chatId,
      `👋 <b>স্বাগতম TradePilot Reseller Bot-এ!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n\n` +
        `বটটি ব্যবহারের জন্য আপনাকে প্রথমে আমাদের অফিসিয়াল চ্যানেল <b>${BOT_CONFIG.OFFICIAL_CHANNEL}</b>-এ জয়েন হতে হবে।\n\n` +
        `নিচের বাটনে ক্লিক করে জয়েন করার পর <b>"✅ Verify Membership / যাচাই করুন"</b> বাটনে চাপুন:`,
      {
        inline_keyboard: [
          [{ text: '📢 Join Official Channel', url: `https://t.me/${BOT_CONFIG.OFFICIAL_CHANNEL.replace('@', '')}` }],
          [{ text: '✅ Verify Membership / যাচাই করুন', callback_data: 'check_channel_join' }],
        ],
      }
    );
    return;
  }

  const isOwner = userId === BOT_CONFIG.OWNER_ID;
  const reseller = botMemory.resellers.get(userId);
  const isApprovedReseller = reseller && reseller.status === 'active';

  // Persistent Keyboard Actions
  if (text === '🔑 Generate VIP License') {
    if (isApprovedReseller || isOwner) {
      await showPackageSelection(chatId);
      return;
    }
  }

  if (text === '💳 My Balance') {
    if (isApprovedReseller || isOwner) {
      const r = reseller || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!;
      await sendTgMessage(
        chatId,
        `💳 <b>My Balance Information</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n` +
          `🏷️ <b>Reseller Code:</b> <code>${r.reseller_code}</code>\n` +
          `💰 <b>Available Balance:</b> <b>৳${r.balance.toFixed(2)} BDT</b> (≈ $${(r.balance / 125).toFixed(2)} USD)\n` +
          `📥 <b>Total Deposited:</b> ৳${r.total_deposited.toFixed(2)}\n` +
          `🔑 <b>Generated Licenses:</b> ${r.total_licenses}\n` +
          `🛡️ <b>Database Sync:</b> 🟢 Supabase Cloud\n\n` +
          `ব্যালেন্স রিচার্জ করতে নিচের <b>"💵 Deposit Request"</b> বাটন ব্যবহার করুন।`
      );
      return;
    }
  }

  if (text === '📜 My Licenses') {
    if (isApprovedReseller || isOwner) {
      await showMyResellerLicenses(chatId, reseller || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!);
      return;
    }
  }

  if (text === '💵 Deposit Request') {
    if (isApprovedReseller || isOwner) {
      await showDepositMethods(chatId);
      return;
    }
  }

  if (text === '🔄 Device Reset') {
    if (isApprovedReseller || isOwner) {
      await showDeviceResetMenu(chatId, reseller || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!);
      return;
    }
  }

  if (text === '💬 Support') {
    await sendTgMessage(
      chatId,
      `💬 <b>TradePilot Official Support</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `যেকোনো সহায়তার জন্য সরাসরি ইনবক্স করুন:\n` +
        `👤 <b>Admin Support:</b> ${BOT_CONFIG.SUPPORT_USERNAME}\n` +
        `📢 <b>Official Channel:</b> ${BOT_CONFIG.OFFICIAL_CHANNEL}`,
      {
        inline_keyboard: [[{ text: '💬 Contact @IshakVhai', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` }]],
      }
    );
    return;
  }

  // Owner Commands
  if (isOwner) {
    if (text === '👑 Owner Admin Panel') {
      await sendTgMessage(
        chatId,
        `👑 <b>TradePilot Owner Admin Panel</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n` +
          `Owner ID: <code>${BOT_CONFIG.OWNER_ID}</code>\n` +
          `Active Resellers: <b>${botMemory.resellers.size}</b>\n` +
          `Pending Deposits: <b>${Array.from(botMemory.deposits.values()).filter((d) => d.status === 'pending').length}</b>\n` +
          `Supabase Bot Table: <code>ishak_bot_data</code>\n` +
          `License Table: <code>ishak_licenses</code>\n\n` +
          `যেকোনো অপশন পরিচালনা করতে নিচের কিবোর্ড বাটন ব্যবহার করুন।`
      );
      return;
    }
    if (text === '➕ Add Reseller') {
      await startAddReseller(chatId, userId);
      return;
    }
    if (text === '➖ Remove Reseller') {
      await startRemoveReseller(chatId, userId);
      return;
    }
    if (text === '👥 Manage Resellers') {
      await showResellersList(chatId);
      return;
    }
    if (text === '💰 Deposit Requests') {
      await showPendingDeposits(chatId);
      return;
    }
    if (text === '🔑 License Manager') {
      await showLicenseManager(chatId);
      return;
    }
    if (text === '📊 Bot Statistics') {
      await showBotStatistics(chatId);
      return;
    }
    if (text === '📢 Broadcast') {
      await startBroadcast(chatId, userId);
      return;
    }
    if (text === '⚙️ Payment Settings') {
      await showPaymentSettings(chatId);
      return;
    }
  }

  // /start or /menu command - ALWAYS INCLUDES CHAT ID
  if (text.startsWith('/start') || text === '/menu') {
    if (isOwner) {
      await sendTgMessage(
        chatId,
        `👑 <b>স্বাগতম OWNER ADMIN PANEL-এ!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n` +
          `🛡️ <b>TradePilot Reseller Management System</b>\n` +
          `👤 <b>Owner ID:</b> <code>${BOT_CONFIG.OWNER_ID}</code>\n` +
          `📡 <b>Official Channel:</b> ${BOT_CONFIG.OFFICIAL_CHANNEL}\n` +
          `💾 <b>Database:</b> Supabase (<code>ishak_bot_data</code> & <code>ishak_licenses</code>)\n\n` +
          `নিচের কিবোর্ড থেকে অপশন নির্বাচন করুন:`,
        getOwnerReplyKeyboard()
      );
      return;
    }

    if (isApprovedReseller) {
      await sendTgMessage(
        chatId,
        `💼 <b>Welcome to TradePilot Reseller Dashboard!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n` +
          `🏷️ <b>Reseller Code:</b> <code>${reseller.reseller_code}</code>\n` +
          `💰 <b>Available Balance:</b> <b>৳${reseller.balance.toFixed(2)} BDT</b>\n` +
          `🔑 <b>Generated Licenses:</b> ${reseller.total_licenses}\n` +
          `🛡️ <b>Status:</b> 🟢 Active Authorized Reseller\n\n` +
          `নিচের কিবোর্ড মেনু ব্যবহার করে কার্যক্রম পরিচালনা করুন:`,
        getResellerReplyKeyboard()
      );
      return;
    }

    // GUEST / NON-RESELLER ACCESS DENIED WITH CHAT ID
    await sendTgMessage(
      chatId,
      `⛔ <b>Access Denied!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n\n` +
        `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n` +
        `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য আপনার উপরের <b>Chat ID</b> টি এডমিনকে জানিয়ে যোগাযোগ করুন।`,
      {
        inline_keyboard: [
          [{ text: '📩 Contact Admin / রিসেলার আবেদন', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
        ],
      }
    );
  }
}

// ==============================================================================
// 6. LICENSE MANAGEMENT (BLOCK / UNBLOCK / DELETE / SEARCH)
// ==============================================================================

export async function showMyResellerLicenses(chatId: number, reseller: ResellerAccount, editMsgId: number | null = null) {
  try {
    const isOwner = reseller.telegram_id === BOT_CONFIG.OWNER_ID;
    let query = supabase.from('ishak_licenses').select('*').order('created_at', { ascending: false }).limit(10);

    // If not Owner, filter by reseller's code or telegram id
    if (!isOwner) {
      query = query.like('note', `%${reseller.reseller_code}%`);
    } else {
      // Exclude maintenance system config keys for clean view
      query = query.neq('tier', 'SYSTEM');
    }

    const { data: licenses, error } = await query;

    if (error || !licenses || licenses.length === 0) {
      const emptyText =
        `📜 <b>My Licenses (0)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `বর্তমানে কোনো লাইসেন্স পাওয়া যায়নি।\n` +
        `নতুন VIP লাইসেন্স তৈরি করতে নিচের <b>"🔑 Generate VIP License"</b> বাটন চাপুন।`;

      if (editMsgId) {
        await editTgMessage(chatId, editMsgId, emptyText);
      } else {
        await sendTgMessage(chatId, emptyText);
      }
      return;
    }

    let text = `📜 <b>${isOwner ? 'Master License Control Panel' : 'My TradePilot Licenses'} (${licenses.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    const buttons: any[] = [];

    licenses.forEach((l: any, idx: number) => {
      const isBlocked = l.active === false;
      const statusIcon = isBlocked ? '🔴 Blocked' : '🟢 Active';
      const shortKey = l.key.length > 20 ? `${l.key.slice(0, 14)}...` : l.key;

      text += `<b>${idx + 1}.</b> <code>${l.key}</code>\n`;
      text += `   💎 Tier: <b>${l.tier}</b> | ⏱️ <b>${l.duration}</b>\n`;
      text += `   📱 Device: ${l.device_id ? '🔒 Bound (HWID)' : '🟢 Unbound'}\n`;
      text += `   🛡️ Status: ${statusIcon}\n\n`;

      if (isBlocked) {
        buttons.push([
          { text: `🟢 Unblock (${shortKey})`, callback_data: `unblock_lic_${l.key}` },
          { text: `🗑️ Delete`, callback_data: `del_lic_prompt_${l.key}` },
        ]);
      } else {
        buttons.push([
          { text: `🚫 Block (${shortKey})`, callback_data: `block_lic_${l.key}` },
          { text: `🗑️ Delete`, callback_data: `del_lic_prompt_${l.key}` },
        ]);
      }
    });

    buttons.push([
      { text: '🔍 Search License Key', callback_data: 'prompt_search_license' },
      { text: '🔄 Refresh List', callback_data: 'refresh_my_licenses' },
    ]);

    if (editMsgId) {
      await editTgMessage(chatId, editMsgId, text, { inline_keyboard: buttons });
    } else {
      await sendTgMessage(chatId, text, { inline_keyboard: buttons });
    }
  } catch (e: any) {
    await sendTgMessage(chatId, `ত্রুটি: লাইসেন্স তালিকা লোড করা সম্ভব হয়নি। (${e.message})`);
  }
}

export async function showSingleLicenseCard(chatId: number, key: string, editMsgId: number | null = null) {
  try {
    const { data: lic, error } = await supabase.from('ishak_licenses').select('*').eq('key', key).single();

    if (error || !lic) {
      const notFound = `❌ লাইসেন্স <code>${key}</code> ডাটাবেজে পাওয়া যায়নি!`;
      if (editMsgId) await editTgMessage(chatId, editMsgId, notFound);
      else await sendTgMessage(chatId, notFound);
      return;
    }

    const isBlocked = lic.active === false;
    const statusIcon = isBlocked ? '🔴 Blocked' : '🟢 Active';
    const note = lic.note || 'None';

    const text =
      `🔑 <b>License Details & Management</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔑 <b>Key:</b> <code>${lic.key}</code>\n` +
      `💎 <b>Tier:</b> ${lic.tier}\n` +
      `⏱️ <b>Duration:</b> ${lic.duration}\n` +
      `🛡️ <b>Status:</b> ${statusIcon}\n` +
      `📱 <b>Device ID:</b> <code>${lic.device_id || 'None (Unbound)'}</code>\n` +
      `📝 <b>Note:</b> ${note}\n\n` +
      `নিচের বাটন চেপে তাৎক্ষণিক অ্যাকশন নিন:`;

    const buttons: any[] = [];
    if (isBlocked) {
      buttons.push([{ text: '🟢 Unblock This Key', callback_data: `unblock_lic_${lic.key}` }]);
    } else {
      buttons.push([{ text: '🚫 Block This Key', callback_data: `block_lic_${lic.key}` }]);
    }

    if (lic.device_id) {
      buttons.push([{ text: '🔄 Reset HWID / Device', callback_data: `reset_device_key_${lic.key}` }]);
    }

    buttons.push([
      { text: '🗑️ Delete License', callback_data: `del_lic_prompt_${lic.key}` },
      { text: '🔙 Back to Licenses', callback_data: 'refresh_my_licenses' },
    ]);

    if (editMsgId) {
      await editTgMessage(chatId, editMsgId, text, { inline_keyboard: buttons });
    } else {
      await sendTgMessage(chatId, text, { inline_keyboard: buttons });
    }
  } catch (e: any) {
    await sendTgMessage(chatId, `ত্রুটি: ${e.message}`);
  }
}

export async function showLicenseManager(chatId: number) {
  try {
    const { count: totalCount } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true });
    const { count: activeCount } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true }).eq('active', true);
    const { count: blockedCount } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true }).eq('active', false);

    const { data: recentLicenses } = await supabase
      .from('ishak_licenses')
      .select('*')
      .neq('tier', 'SYSTEM')
      .order('created_at', { ascending: false })
      .limit(6);

    let text =
      `🔑 <b>Supabase License Control Center</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 <b>Total Licenses:</b> <b>${totalCount || 0}</b>\n` +
      `🟢 <b>Active:</b> ${activeCount || 0}  |  🔴 <b>Blocked:</b> ${blockedCount || 0}\n` +
      `💾 <b>Database Table:</b> <code>ishak_licenses</code>\n\n` +
      `<b>Recent VIP Licenses:</b>\n`;

    const buttons: any[] = [];

    if (recentLicenses && recentLicenses.length > 0) {
      recentLicenses.forEach((l: any, i: number) => {
        const isBlocked = l.active === false;
        const shortKey = l.key.length > 20 ? `${l.key.slice(0, 14)}...` : l.key;
        text += `${i + 1}. <code>${l.key}</code> (${isBlocked ? '🔴 Blocked' : '🟢 Active'})\n`;

        if (isBlocked) {
          buttons.push([
            { text: `🟢 Unblock ${shortKey}`, callback_data: `unblock_lic_${l.key}` },
            { text: `🗑️ Delete`, callback_data: `del_lic_prompt_${l.key}` },
          ]);
        } else {
          buttons.push([
            { text: `🚫 Block ${shortKey}`, callback_data: `block_lic_${l.key}` },
            { text: `🗑️ Delete`, callback_data: `del_lic_prompt_${l.key}` },
          ]);
        }
      });
    }

    buttons.push([
      { text: '🔍 Search License Key', callback_data: 'prompt_search_license' },
      { text: '🔄 Reset Device HWID', callback_data: 'owner_reset_device_menu' },
    ]);

    await sendTgMessage(chatId, text, { inline_keyboard: buttons });
  } catch (e: any) {
    await sendTgMessage(chatId, `লাইসেন্স লোড করতে সমস্যা হয়েছে: ${e.message}`);
  }
}

export async function showDeviceResetMenu(chatId: number, reseller: ResellerAccount) {
  try {
    const isOwner = reseller.telegram_id === BOT_CONFIG.OWNER_ID;
    let query = supabase.from('ishak_licenses').select('*').not('device_id', 'is', null).limit(6);

    if (!isOwner) {
      query = query.like('note', `%${reseller.reseller_code}%`);
    }

    const { data: boundLicenses } = await query;

    if (!boundLicenses || boundLicenses.length === 0) {
      await sendTgMessage(
        chatId,
        `ℹ️ <b>Device Reset:</b> কোনো লাইসেন্সে এই মুহূর্তে কোনো ডিভাইস আবদ্ধ (Bound) নেই।\n` +
          `ক্লায়েন্ট ট্রেডিং বটে লগইন করলেই কেবল HWID বাইন্ড হয়।`
      );
      return;
    }

    const buttons = boundLicenses.map((l: any) => [
      { text: `🔄 Reset: ${l.key.slice(0, 16)}...`, callback_data: `reset_device_key_${l.key}` },
    ]);

    await sendTgMessage(
      chatId,
      `🔄 <b>Device Reset (HWID Unbind)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `যে লাইসেন্সের ডিভাইস আনবাইন্ড করতে চান তা নির্বাচন করুন:`,
      { inline_keyboard: buttons }
    );
  } catch (e: any) {
    await sendTgMessage(chatId, `ত্রুটি: ডিভাইস রিসেট তালিকা লোড করা যায়নি।`);
  }
}

// ==============================================================================
// 7. SUB-MENUS & HELPERS
// ==============================================================================

export async function showDepositMethods(chatId: number) {
  await sendTgMessage(
    chatId,
    `💵 <b>Deposit Payment Method</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `ব্যালেন্স রিচার্জের জন্য পেমেন্ট মাধ্যম নির্বাচন করুন:\n\n` +
      `🔴 <b>bKash Personal:</b> <code>${botMemory.paymentSettings.bkash}</code>\n` +
      `🟡 <b>Binance Pay / USDT:</b> <code>${botMemory.paymentSettings.binancePayId}</code>\n\n` +
      `পেমেন্ট সম্পন্ন করার পর নিচের বাটন চেপে TrxID সাবমিট করুন:`,
    {
      inline_keyboard: [
        [{ text: '🔴 bKash Personal', callback_data: 'dep_method_bkash' }],
        [{ text: '🟡 Binance Pay / USDT', callback_data: 'dep_method_binance' }],
      ],
    }
  );
}

export async function showPackageSelection(chatId: number) {
  const buttons = botMemory.packages.map((pkg) => [
    {
      text: `💎 ${pkg.name} - ৳${pkg.price_bdt} ($${pkg.price_usd})`,
      callback_data: `buy_vip_pkg_${pkg.id}`,
    },
  ]);

  await sendTgMessage(
    chatId,
    `🔑 <b>Select VIP License Duration</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `প্যাকেজ মূল্য আপনার ব্যালেন্স থেকে কর্তন হবে এবং সাথে সাথে Supabase-এ <b>VIP Tier</b> কী তৈরি হবে:`,
    { inline_keyboard: buttons }
  );
}

export async function startAddReseller(chatId: number, userId: number) {
  botMemory.userStates.set(userId, { flow: 'ADD_RESELLER', step: 'ASK_TARGET' });
  await sendTgMessage(
    chatId,
    `➕ <b>Manual Reseller Addition</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `নতুন রিসেলারের <b>Telegram Chat ID</b> অথবা <b>Username</b> লিখে পাঠান:\n\n` +
      `<i>(উদাহরণ: 8274806813 অথবা @IshakVhai)</i>`
  );
}

export async function startRemoveReseller(chatId: number, userId: number) {
  const resellers = Array.from(botMemory.resellers.values()).filter((r) => r.telegram_id !== BOT_CONFIG.OWNER_ID);

  if (resellers.length === 0) {
    await sendTgMessage(chatId, `ℹ️ রিমুভ করার মতো কোনো সাধারণ রিসেলার এই মুহূর্তে নেই।`);
    return;
  }

  const buttons = resellers.map((r) => [
    { text: `🗑️ Remove ${r.reseller_code} (${r.username || r.telegram_id})`, callback_data: `confirm_remove_rsl_${r.telegram_id}` },
  ]);

  await sendTgMessage(
    chatId,
    `➖ <b>Remove Reseller</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `যেই রিসেলারকে রিমুভ করতে চান তাকে নির্বাচন করুন:\n` +
      `<i>(রিমুভ করলে রিসেলারের ড্যাশবোর্ড এক্সেস তাৎক্ষণিক বাতিল হবে ও Supabase থেকে মুছে যাবে)</i>`,
    { inline_keyboard: buttons }
  );
}

export async function showResellersList(chatId: number) {
  const resellers = Array.from(botMemory.resellers.values());
  let text = `👥 <b>Active Resellers List (${resellers.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const buttons: any[] = [];
  resellers.forEach((r) => {
    text += `• <b>${r.reseller_code}</b> | TG: <code>${r.telegram_id}</code> (@${r.username || 'N/A'})\n`;
    text += `  💰 Balance: <b>৳${r.balance.toFixed(2)}</b> | Total Generated: ${r.total_licenses}\n\n`;

    if (r.telegram_id !== BOT_CONFIG.OWNER_ID) {
      buttons.push([
        { text: `🗑️ Remove ${r.reseller_code}`, callback_data: `confirm_remove_rsl_${r.telegram_id}` },
      ]);
    }
  });

  await sendTgMessage(chatId, text, { inline_keyboard: buttons });
}

export async function showPendingDeposits(chatId: number) {
  const pending = Array.from(botMemory.deposits.values()).filter((d) => d.status === 'pending');
  let text = `💰 <b>Pending Deposits (${pending.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  const buttons: any[] = [];

  if (pending.length === 0) {
    text += `বর্তমানে কোনো পেন্ডিং ডিপোজিট রিকোয়েস্ট নেই।`;
  } else {
    pending.forEach((d) => {
      text += `🆔 <b>#${d.id}</b> | <b>৳${d.amount}</b> (${d.method})\n`;
      text += `Reseller: <code>${d.reseller_code}</code> | TrxID: <code>${d.transaction_id}</code>\n`;
      text += `Sender: <code>${d.sender}</code>\n\n`;

      buttons.push([
        { text: `✅ Approve #${d.id} (+৳${d.amount})`, callback_data: `admin_approve_dep_${d.id}` },
        { text: `❌ Reject #${d.id}`, callback_data: `admin_reject_dep_${d.id}` },
      ]);
    });
  }

  await sendTgMessage(chatId, text, { inline_keyboard: buttons });
}

export async function showBotStatistics(chatId: number) {
  const { count: totalLicenses } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true });
  const activeResellers = botMemory.resellers.size;
  const totalVolume = Array.from(botMemory.deposits.values())
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  await sendTgMessage(
    chatId,
    `📊 <b>TradePilot Bot Statistics</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 <b>Total Users Interacted:</b> ${botMemory.users.size}\n` +
      `💼 <b>Active Resellers:</b> ${activeResellers}\n` +
      `🔑 <b>Total Supabase Licenses:</b> ${totalLicenses || 0}\n` +
      `💵 <b>Total Approved Volume:</b> ৳${totalVolume.toFixed(2)} BDT\n` +
      `💾 <b>Database Table:</b> <code>ishak_bot_data</code> (Supabase)\n` +
      `⚡ <b>Engine:</b> Node.js v4.0 Active Cloud Engine`
  );
}

export async function showPaymentSettings(chatId: number) {
  await sendTgMessage(
    chatId,
    `⚙️ <b>Payment Gateways Configuration</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 <b>bKash Personal Number:</b> <code>${botMemory.paymentSettings.bkash}</code>\n` +
      `🟡 <b>Binance Pay ID:</b> <code>${botMemory.paymentSettings.binancePayId}</code>\n\n` +
      `পরিবর্তন করতে নিচের বাটন নির্বাচন করুন:`,
    {
      inline_keyboard: [
        [{ text: '🔴 Change bKash Number', callback_data: 'change_bkash_setting' }],
        [{ text: '🟡 Change Binance Pay ID', callback_data: 'change_binance_setting' }],
      ],
    }
  );
}

export async function startBroadcast(chatId: number, userId: number) {
  botMemory.userStates.set(userId, { flow: 'BROADCAST' });
  await sendTgMessage(
    chatId,
    `📢 <b>Broadcast Announcement</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `সকল ব্যবহারকারী ও রিসেলারদের উদ্দেশ্যে যে নোটিশ বা মেসেজটি পাঠাতে চান তা লিখে সেন্ড করুন:\n\n` +
      `<i>(বাতিল করতে /menu লিখুন)</i>`
  );
}

// ==============================================================================
// 8. CONVERSATIONAL STATE HANDLER
// ==============================================================================

export async function handleState(userId: number, chatId: number, text: string, state: any) {
  if (text === '/cancel' || text === '/menu') {
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `❌ বর্তমান কার্যক্রম বাতিল করা হয়েছে।`);
    return;
  }

  // Search License Key
  if (state.flow === 'SEARCH_LICENSE') {
    botMemory.userStates.delete(userId);
    const key = text.trim();
    await showSingleLicenseCard(chatId, key);
    return;
  }

  // Add Reseller
  if (state.flow === 'ADD_RESELLER' && userId === BOT_CONFIG.OWNER_ID) {
    if (state.step === 'ASK_TARGET') {
      const cleanTarget = text.replace('@', '').trim();
      const targetId = parseInt(cleanTarget) || Math.floor(100000000 + Math.random() * 900000000);
      state.targetId = targetId;
      state.targetUsername = cleanTarget;
      state.step = 'ASK_BALANCE';
      botMemory.userStates.set(userId, state);

      await sendTgMessage(
        chatId,
        `💰 <b>Initial Balance:</b>\nনতুন রিসেলারের একাউন্টে প্রাথমিক ব্যালেন্স কত যোগ করতে চান? (BDT সংখ্যায় লিখুন, যেমন: 1000 বা 5000):`
      );
      return;
    }

    if (state.step === 'ASK_BALANCE') {
      const balance = parseFloat(text) || 0;
      const targetId = state.targetId;
      const rCode = `TP-RSL-${Math.floor(1000 + Math.random() * 9000)}`;

      const newReseller: ResellerAccount = {
        id: targetId,
        telegram_id: targetId,
        username: state.targetUsername,
        reseller_code: rCode,
        business_name: `Reseller ${state.targetUsername}`,
        balance,
        total_deposited: balance,
        total_licenses: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      await saveResellerToSupabase(newReseller);
      botMemory.userStates.delete(userId);

      await sendTgMessage(
        chatId,
        `✅ <b>New Reseller Added Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Telegram ID:</b> <code>${targetId}</code>\n` +
          `🏷️ <b>Reseller Code:</b> <code>${rCode}</code>\n` +
          `💰 <b>Starting Balance:</b> ৳${balance.toFixed(2)} BDT\n` +
          `💾 <b>Saved to Supabase:</b> 🟢 <code>ishak_bot_data</code>\n\n` +
          `রিসেলার এখন বট চালু করে ড্যাশবোর্ড ব্যবহার করতে পারবেন।`
      );

      // Notify the new reseller if they already interacted
      await sendTgMessage(
        targetId,
        `🎉 <b>অভিনন্দন! আপনার TradePilot Reseller একাউন্ট অনুমোদিত হয়েছে।</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Reseller Code:</b> <code>${rCode}</code>\n` +
          `💰 <b>Starting Balance:</b> ৳${balance.toFixed(2)} BDT\n\n` +
          `এখন /start চেপে আপনার রিসেলার মেনু ব্যবহার করুন:`,
        getResellerReplyKeyboard()
      );
      return;
    }
  }

  // Deposit Flow
  if (state.flow === 'DEPOSIT') {
    if (state.step === 'ASK_AMOUNT') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount < 10) {
        await sendTgMessage(chatId, `⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500 বা 1000):`);
        return;
      }
      state.amount = amount;
      state.step = 'ASK_TRXID';
      botMemory.userStates.set(userId, state);
      await sendTgMessage(chatId, `📝 <b>Transaction ID (TrxID) / Payment ID লিখুন:</b>`);
      return;
    }

    if (state.step === 'ASK_TRXID') {
      const trxId = text.trim().toUpperCase();
      if (trxId.length < 5) {
        await sendTgMessage(chatId, `⚠️ সঠিক Transaction ID দিন (কমপক্ষে ৫ অক্ষর):`);
        return;
      }

      for (const d of botMemory.deposits.values()) {
        if (d.transaction_id === trxId) {
          await sendTgMessage(chatId, `❌ <b>এই TrxID ইতিপূর্বে ব্যবহার করা হয়েছে!</b> অন্য TrxID দিন:`);
          return;
        }
      }

      state.trxId = trxId;
      state.step = 'ASK_SENDER';
      botMemory.userStates.set(userId, state);
      await sendTgMessage(chatId, `📱 <b>Sender Number / Binance Pay ID লিখুন:</b>`);
      return;
    }

    if (state.step === 'ASK_SENDER') {
      const sender = text.trim();
      botMemory.userStates.delete(userId);

      const depId = Math.floor(100 + Math.random() * 900);
      const reseller = botMemory.resellers.get(userId) || { reseller_code: `TP-RSL-${userId}` };

      const depositRecord: DepositRecord = {
        id: depId,
        telegram_id: userId,
        reseller_code: (reseller as any).reseller_code,
        method: state.method,
        amount: state.amount,
        transaction_id: state.trxId,
        sender,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      await saveDepositToSupabase(depositRecord);

      await sendTgMessage(
        chatId,
        `✅ <b>Deposit Request Submitted Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Deposit ID:</b> #${depId}\n` +
          `💳 <b>Method:</b> ${state.method}\n` +
          `💰 <b>Amount:</b> ৳${state.amount.toFixed(2)}\n` +
          `🔢 <b>TrxID:</b> <code>${state.trxId}</code>\n` +
          `📱 <b>Sender:</b> ${sender}\n` +
          `⏳ <b>Status:</b> 🟡 Pending Admin Verification`
      );

      // Alert Owner
      await sendTgMessage(
        BOT_CONFIG.OWNER_ID,
        `💰 <b>নতুন DEPOSIT রিকোয়েস্ট এসেছে!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>ID:</b> #${depId}\n` +
          `👤 <b>Reseller:</b> <code>${(reseller as any).reseller_code}</code> (TG: ${userId})\n` +
          `💳 <b>Method:</b> ${state.method}\n` +
          `💵 <b>Amount:</b> <b>৳${state.amount.toFixed(2)}</b>\n` +
          `🔢 <b>TrxID:</b> <code>${state.trxId}</code>\n` +
          `📱 <b>Sender:</b> <code>${sender}</code>\n\n` +
          `অ্যাকশন বেছে নিন:`,
        {
          inline_keyboard: [
            [
              { text: `✅ Approve (+৳${state.amount})`, callback_data: `admin_approve_dep_${depId}` },
              { text: `❌ Reject`, callback_data: `admin_reject_dep_${depId}` },
            ],
          ],
        }
      );
      return;
    }
  }

  // Broadcast
  if (state.flow === 'BROADCAST' && userId === BOT_CONFIG.OWNER_ID) {
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `📡 <b>ব্রডকাস্ট পাঠানো হচ্ছে...</b>`);
    let sent = 0;
    for (const [uId] of botMemory.users) {
      const r = await sendTgMessage(uId, `📢 <b>Official Announcement:</b>\n\n${text}`);
      if (r.ok) sent++;
    }
    await sendTgMessage(chatId, `✅ <b>ব্রডকাস্ট সম্পন্ন!</b> মোট ${sent} জনের কাছে পাঠানো হয়েছে।`);
    return;
  }

  // Update Settings
  if (state.flow === 'UPDATE_BKASH' && userId === BOT_CONFIG.OWNER_ID) {
    botMemory.paymentSettings.bkash = text.trim();
    await saveSettingsToSupabase(botMemory.paymentSettings);
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>${botMemory.paymentSettings.bkash}</code>`);
    return;
  }

  if (state.flow === 'UPDATE_BINANCE' && userId === BOT_CONFIG.OWNER_ID) {
    botMemory.paymentSettings.binancePayId = text.trim();
    await saveSettingsToSupabase(botMemory.paymentSettings);
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>${botMemory.paymentSettings.binancePayId}</code>`);
    return;
  }
}

// ==============================================================================
// 9. CALLBACK ROUTER
// ==============================================================================

export async function onCallback(cb: any) {
  const queryId = cb.id;
  const message = cb.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const data = cb.data;
  const userId = cb.from.id;

  if (data === 'check_channel_join') {
    const isMember = await checkChannelMembership(userId);
    if (isMember) {
      await answerCallback(queryId, '✅ চ্যানেল ভেরিফিকেশন সফল হয়েছে!', true);
      const reseller = botMemory.resellers.get(userId);
      if (userId === BOT_CONFIG.OWNER_ID) {
        await editTgMessage(chatId, messageId, `🎉 <b>Welcome Owner!</b>\n🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\nনিচের কিবোর্ড থেকে অপশন ব্যবহার করুন:`);
        await sendTgMessage(chatId, `👑 <b>Owner Controls:</b>`, getOwnerReplyKeyboard());
      } else if (reseller && reseller.status === 'active') {
        await editTgMessage(chatId, messageId, `🎉 <b>ভেরিফিকেশন সফল!</b>\n🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\nনিচের কিবোর্ড থেকে মেনু ব্যবহার করুন:`);
        await sendTgMessage(chatId, `💼 <b>Reseller Dashboard:</b>`, getResellerReplyKeyboard());
      } else {
        await editTgMessage(
          chatId,
          messageId,
          `⛔ <b>Access Denied!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🆔 <b>Your Chat ID:</b> <code>${chatId}</code>\n\n` +
            `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n` +
            `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য আপনার <b>Chat ID</b> টি এডমিনকে জানিয়ে যোগাযোগ করুন।`,
          {
            inline_keyboard: [
              [{ text: '📩 Contact Admin / রিসেলার আবেদন', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
            ],
          }
        );
      }
    } else {
      await answerCallback(queryId, '❌ এখনও চ্যানেলে জয়েন পাওয়া যায়নি!', true);
    }
    return;
  }

  // Prompt search
  if (data === 'prompt_search_license') {
    botMemory.userStates.set(userId, { flow: 'SEARCH_LICENSE' });
    await answerCallback(queryId);
    await sendTgMessage(
      chatId,
      `🔍 <b>License Key Search:</b>\nযে লাইসেন্সটি দেখতে বা Block/Unblock/Delete করতে চান সেই লাইসেন্স Key টি লিখে পাঠান:`
    );
    return;
  }

  // Refresh my licenses
  if (data === 'refresh_my_licenses') {
    await answerCallback(queryId, 'লাইসেন্স তালিকা রিফ্রেশ করা হচ্ছে...');
    const reseller = botMemory.resellers.get(userId) || (userId === BOT_CONFIG.OWNER_ID ? botMemory.resellers.get(BOT_CONFIG.OWNER_ID)! : null);
    if (reseller) {
      await showMyResellerLicenses(chatId, reseller, messageId);
    }
    return;
  }

  // Deposit Methods
  if (data === 'dep_method_bkash') {
    botMemory.userStates.set(userId, { flow: 'DEPOSIT', method: 'bKash Personal', step: 'ASK_AMOUNT' });
    await answerCallback(queryId);
    await sendTgMessage(
      chatId,
      `🔴 <b>bKash Personal Payment Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `নম্বর: <code>${botMemory.paymentSettings.bkash}</code> (Personal - Send Money)\n\n` +
        `১. bKash App থেকে উপরের নম্বরে <b>Send Money</b> করুন।\n` +
        `২. সর্বনিম্ন ডিপোজিট: <b>৳৫০০ BDT</b>\n\n` +
        `টাকা পাঠানোর পর আপনি কত টাকা পাঠিয়েছেন তা সংখ্যায় লিখে পাঠান (যেমন: 500, 1000):`
    );
    return;
  }

  if (data === 'dep_method_binance') {
    botMemory.userStates.set(userId, { flow: 'DEPOSIT', method: 'Binance Pay / USDT', step: 'ASK_AMOUNT' });
    await answerCallback(queryId);
    await sendTgMessage(
      chatId,
      `🟡 <b>Binance Pay / USDT Payment Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `Binance Pay ID: <code>${botMemory.paymentSettings.binancePayId}</code>\n\n` +
        `১. Binance App থেকে <b>Pay</b> অপশনে গিয়ে উপরের Pay ID-তে USDT Send করুন।\n` +
        `২. সমমূল্য BDT ব্যালেন্স পেতে রেট: $1 = ৳125 BDT।\n\n` +
        `ডলার পাঠানোর পর আপনি কত BDT সমপরিমাণ পাঠিয়েছেন বা কত USD তা সংখ্যায় লিখুন:`
    );
    return;
  }

  // ================= VIP LICENSE GENERATION WITH LIVE PROGRESS LOADING =================
  if (data.startsWith('buy_vip_pkg_')) {
    const pkgId = parseInt(data.replace('buy_vip_pkg_', ''));
    const pkg = botMemory.packages.find((p) => p.id === pkgId);
    const reseller = botMemory.resellers.get(userId) || (userId === BOT_CONFIG.OWNER_ID ? botMemory.resellers.get(BOT_CONFIG.OWNER_ID) : null);

    if (!pkg || !reseller) {
      await answerCallback(queryId, 'প্যাকেজ বা রিসেলার পাওয়া যায়নি!', true);
      return;
    }

    if (reseller.balance < pkg.price_bdt) {
      await answerCallback(queryId, '❌ অপর্যাপ্ত ব্যালেন্স!', true);
      await editTgMessage(
        chatId,
        messageId,
        `❌ <b>Insufficient Balance!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `প্যাকেজ মূল্য: <b>৳${pkg.price_bdt}</b> ($${pkg.price_usd})\n` +
          `আপনার বর্তমান ব্যালেন্স: <b>৳${reseller.balance.toFixed(2)}</b>\n\n` +
          `অনুগ্রহ করে প্রথমে ব্যালেন্স ডিপোজিট করুন।`
      );
      return;
    }

    await answerCallback(queryId, '⚡ VIP লাইসেন্স তৈরি প্রক্রিয়া শুরু হয়েছে...');

    // 1. Initial deduction & persist
    reseller.balance -= pkg.price_bdt;
    reseller.total_licenses += 1;
    await saveResellerToSupabase(reseller);

    // 2. LIVE PROGRESS LOADING ANIMATION
    try {
      await editTgMessage(
        chatId,
        messageId,
        `⚡ <b>VIP License Generating...</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `<code>[██░░░░░░░░░░] 12%</code>\n` +
          `⚙️ <i>Initializing Quotex VIP Signal Protocol...</i>`
      );
      await sleep(300);

      await editTgMessage(
        chatId,
        messageId,
        `⚡ <b>VIP License Generating...</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `<code>[████░░░░░░░░] 38%</code>\n` +
          `🔐 <i>Generating Hardware Encryption Hash...</i>`
      );
      await sleep(350);

      await editTgMessage(
        chatId,
        messageId,
        `⚡ <b>VIP License Generating...</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `<code>[███████░░░░░] 68%</code>\n` +
          `📡 <i>Connecting to Supabase Cloud Node...</i>`
      );
      await sleep(350);

      await editTgMessage(
        chatId,
        messageId,
        `⚡ <b>VIP License Generating...</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `<code>[██████████░░] 92%</code>\n` +
          `💎 <i>Applying 1-Trade Auto VIP Permissions...</i>`
      );
      await sleep(300);
    } catch (animErr) {
      // Ignore rate-limit
    }

    // 3. Insert into Supabase 'ishak_licenses'
    const res = await createSupabaseVipLicense({
      durationDays: pkg.duration_days,
      durationCode: pkg.duration_code,
      resellerCode: reseller.reseller_code,
    });

    if (!res.success) {
      reseller.balance += pkg.price_bdt;
      reseller.total_licenses -= 1;
      await saveResellerToSupabase(reseller);
      await editTgMessage(chatId, messageId, `❌ লাইসেন্স তৈরিতে সমস্যা: ${res.error}`);
      return;
    }

    const licenseKey = res.license.key;

    // Delivery message cleanly wrapped in <pre>
    const deliveryContent =
`⚡ TRADEPILOT - LICENSE DELIVERY ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Congratulations! Your TradePilot Trading Bot License is ready.

🔑 License Key: ${licenseKey}
💎 Membership Tier: VIP
⏱️ Time Limit: ${pkg.duration_days} Days
⌛ Expiry Status: Countdown starts upon first login in the bot
📱 Device Limit: 1 Device
👤 Reseller: ${reseller.reseller_code}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 How to Activate & Trade in Quotex:
1. Open Quotex in Browser.
2. Launch the TradePilot Trading Bot widget on your chart.
3. Click the Bot Logo / VIP Key button.
4. Enter your VIP License Key and click "Verify & Unlock".
5. Choose your desired Timeframe to start receiving 1-trade auto signals!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const fullMessage =
      `🎉 <b>VIP License Generated Successfully! [100%]</b>\n` +
      `<i>(নিচের বক্সে একবার ট্যাপ করলেই পুরো ডেলিভারি মেসেজ কপি হবে)</i>\n\n` +
      `<pre>${deliveryContent}</pre>\n\n` +
      `💰 <b>Available Balance:</b> ৳${reseller.balance.toFixed(2)} BDT`;

    await editTgMessage(chatId, messageId, fullMessage, {
      inline_keyboard: [
        [{ text: '📜 View In My Licenses', callback_data: 'refresh_my_licenses' }],
      ],
    });
    return;
  }

  // ================= RESELLER LICENSE ACTIONS (BLOCK / UNBLOCK / DELETE) =================
  if (data.startsWith('block_lic_')) {
    const key = data.replace('block_lic_', '');
    const isOwner = userId === BOT_CONFIG.OWNER_ID;

    try {
      const { data: lic, error: fetchErr } = await supabase
        .from('ishak_licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (fetchErr || !lic) {
        await answerCallback(queryId, 'লাইসেন্স পাওয়া যায়নি!', true);
        return;
      }

      const note = lic.note || '';

      if (!isOwner && note.includes('[BLOCKED_DONE]')) {
        await answerCallback(queryId, '⚠️ আপনি এই লাইসেন্সটি ইতিপূর্বে ১ বার ব্লক ও ১ বার আনব্লক করেছেন। আর ব্লক করা সম্ভব নয়।', true);
        return;
      }

      if (lic.active === false) {
        await answerCallback(queryId, 'লাইসেন্সটি ইতিমধ্যেই ব্লক আছে।', true);
        return;
      }

      const newNote = isOwner ? note : `${note} [BLOCKED_1]`;
      await supabase
        .from('ishak_licenses')
        .update({ active: false, note: newNote })
        .eq('key', key);

      await answerCallback(queryId, `🚫 লাইসেন্স ${key} ব্লক করা হয়েছে!`, true);

      await editTgMessage(
        chatId,
        messageId,
        `🚫 <b>License Blocked Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔑 <b>License:</b> <code>${key}</code>\n` +
          `🛡️ <b>Status:</b> 🔴 Blocked\n\n` +
          `<i>ক্লায়েন্ট এখন আর এই লাইসেন্স দিয়ে লগইন করতে পারবে না।</i>`,
        {
          inline_keyboard: [
            [{ text: '🟢 Unblock This Key', callback_data: `unblock_lic_${key}` }],
            [{ text: '🗑️ Delete License', callback_data: `del_lic_prompt_${key}` }],
            [{ text: '🔙 Back to My Licenses', callback_data: 'refresh_my_licenses' }],
          ],
        }
      );
    } catch (e: any) {
      await answerCallback(queryId, 'ব্লক করতে সমস্যা হয়েছে', true);
    }
    return;
  }

  if (data.startsWith('unblock_lic_')) {
    const key = data.replace('unblock_lic_', '');
    const isOwner = userId === BOT_CONFIG.OWNER_ID;

    try {
      const { data: lic, error: fetchErr } = await supabase
        .from('ishak_licenses')
        .select('*')
        .eq('key', key)
        .single();

      if (fetchErr || !lic) {
        await answerCallback(queryId, 'লাইসেন্স পাওয়া যায়নি!', true);
        return;
      }

      const note = lic.note || '';

      if (!isOwner && note.includes('[BLOCKED_DONE]')) {
        await answerCallback(queryId, '⚠️ এই লাইসেন্সটির আনব্লক সীমা শেষ হয়ে গেছে।', true);
        return;
      }

      if (lic.active === true) {
        await answerCallback(queryId, 'লাইসেন্সটি ইতিমধ্যেই একটিভ আছে।', true);
        return;
      }

      const newNote = isOwner ? note : note.replace('[BLOCKED_1]', '[BLOCKED_DONE]');
      await supabase
        .from('ishak_licenses')
        .update({ active: true, note: newNote })
        .eq('key', key);

      await answerCallback(queryId, `🟢 লাইসেন্স ${key} আনব্লক করা হয়েছে!`, true);

      await editTgMessage(
        chatId,
        messageId,
        `🟢 <b>License Unblocked Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔑 <b>License:</b> <code>${key}</code>\n` +
          `🛡️ <b>Status:</b> 🟢 Active\n\n` +
          `<i>লাইসেন্সটি পুনরায় কার্যকর হয়েছে।</i>`,
        {
          inline_keyboard: [
            [{ text: '🚫 Block This Key', callback_data: `block_lic_${key}` }],
            [{ text: '🗑️ Delete License', callback_data: `del_lic_prompt_${key}` }],
            [{ text: '🔙 Back to My Licenses', callback_data: 'refresh_my_licenses' }],
          ],
        }
      );
    } catch (e: any) {
      await answerCallback(queryId, 'আনব্লক করতে সমস্যা হয়েছে', true);
    }
    return;
  }

  // Delete Prompt
  if (data.startsWith('del_lic_prompt_')) {
    const key = data.replace('del_lic_prompt_', '');
    await answerCallback(queryId);
    await editTgMessage(
      chatId,
      messageId,
      `⚠️ <b>Delete Confirmation!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `আপনি কি নিশ্চিতভাবে এই লাইসেন্সটি ডাটাবেজ থেকে চিরতরে ডিলিট করতে চান?\n\n` +
        `🔑 <b>Key:</b> <code>${key}</code>\n` +
        `<i>ডিলিট করলে ক্লায়েন্ট আর এই কী দিয়ে লগইন করতে পারবে না।</i>`,
      {
        inline_keyboard: [
          [
            { text: '🗑️ হ্যাঁ, চিরতরে ডিলিট করুন', callback_data: `del_lic_confirm_${key}` },
            { text: '❌ বাতিল', callback_data: 'del_lic_cancel' },
          ],
        ],
      }
    );
    return;
  }

  if (data.startsWith('del_lic_confirm_')) {
    const key = data.replace('del_lic_confirm_', '');
    try {
      const { error } = await supabase.from('ishak_licenses').delete().eq('key', key);

      if (error) {
        await answerCallback(queryId, `ডিলিট ব্যর্থ: ${error.message}`, true);
      } else {
        await answerCallback(queryId, '🗑️ লাইসেন্স সফলভাবে ডিলিট হয়েছে!', true);
        await editTgMessage(
          chatId,
          messageId,
          `🗑️ <b>License Deleted!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `লাইসেন্স <code>${key}</code> ডাটাবেজ থেকে সফলভাবে মুছে ফেলা হয়েছে।`,
          {
            inline_keyboard: [[{ text: '🔙 Back to My Licenses', callback_data: 'refresh_my_licenses' }]],
          }
        );
      }
    } catch (e: any) {
      await answerCallback(queryId, 'ডিলিট করতে সমস্যা হয়েছে', true);
    }
    return;
  }

  if (data === 'del_lic_cancel') {
    await answerCallback(queryId, 'বাতিল করা হয়েছে');
    await editTgMessage(chatId, messageId, `❌ লাইসেন্স ডিলিট বাতিল করা হয়েছে।`, {
      inline_keyboard: [[{ text: '🔙 Back to My Licenses', callback_data: 'refresh_my_licenses' }]],
    });
    return;
  }

  // Device Reset
  if (data.startsWith('reset_device_key_')) {
    const key = data.replace('reset_device_key_', '');
    try {
      const { error } = await supabase
        .from('ishak_licenses')
        .update({ device_id: null, last_used_at: null })
        .eq('key', key);

      if (error) {
        await answerCallback(queryId, `ত্রুটি: ${error.message}`, true);
      } else {
        await answerCallback(queryId, '✅ ডিভাইস রিসেট সফল হয়েছে!', true);
        await editTgMessage(
          chatId,
          messageId,
          `✅ <b>Device Reset Successful!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `License: <code>${key}</code>\n` +
            `পূর্ববর্তী Device Binding আনলক করা হয়েছে। ক্লায়েন্ট এখন নতুন ডিভাইসে লগইন করতে পারবেন।`,
          {
            inline_keyboard: [[{ text: '🔙 Back to Licenses', callback_data: 'refresh_my_licenses' }]],
          }
        );
      }
    } catch (e: any) {
      await answerCallback(queryId, 'ব্যর্থ হয়েছে', true);
    }
    return;
  }

  // Admin Actions
  if (userId === BOT_CONFIG.OWNER_ID) {
    if (data.startsWith('confirm_remove_rsl_')) {
      const targetTgId = parseInt(data.replace('confirm_remove_rsl_', ''));
      const targetReseller = botMemory.resellers.get(targetTgId);

      if (!targetReseller) {
        await answerCallback(queryId, 'রিসেলার পাওয়া যায়নি!', true);
        return;
      }

      await removeResellerFromSupabase(targetTgId);
      await answerCallback(queryId, `✅ Reseller ${targetReseller.reseller_code} রিমুভ করা হয়েছে!`, true);
      await editTgMessage(
        chatId,
        messageId,
        `✅ <b>Reseller Removed!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `Code: <code>${targetReseller.reseller_code}</code> (TG: ${targetTgId})\n` +
          `রিসেলারকে সিস্টেম ও Supabase থেকে স্থায়ীভাবে রিমুভ করা হয়েছে।`
      );

      // Notify the removed reseller
      await sendTgMessage(
        targetTgId,
        `⚠️ <b>আপনার TradePilot Reseller একাউন্ট বাতিল করা হয়েছে।</b>\n` +
          `বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন: ${BOT_CONFIG.SUPPORT_USERNAME}`
      );
      return;
    }

    // ================= DEPOSIT APPROVAL WITH SUPABASE SYNC =================
    if (data.startsWith('admin_approve_dep_')) {
      const depId = parseInt(data.replace('admin_approve_dep_', ''));
      const dep = botMemory.deposits.get(depId);

      if (!dep) {
        await answerCallback(queryId, 'ডিপোজিট রেকর্ড পাওয়া যায়নি!', true);
        return;
      }

      dep.status = 'approved';
      await saveDepositToSupabase(dep);

      const reseller = botMemory.resellers.get(dep.telegram_id);
      if (reseller) {
        reseller.balance += dep.amount;
        reseller.total_deposited += dep.amount;
        await saveResellerToSupabase(reseller);
      }

      await answerCallback(queryId, `✅ Deposit #${depId} Approved!`, true);
      await editTgMessage(
        chatId,
        messageId,
        `✅ <b>Deposit #${depId} Approved Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `Reseller: <code>${dep.reseller_code}</code>\n` +
          `Amount: <b>৳${dep.amount.toFixed(2)}</b>\n` +
          `TrxID: <code>${dep.transaction_id}</code>\n` +
          `New Balance: <b>৳${reseller?.balance.toFixed(2) || '0.00'}</b>`
      );

      // Notify Reseller
      await sendTgMessage(
        dep.telegram_id,
        `🎉 <b>Deposit Approved!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `আপনার <b>৳${dep.amount.toFixed(2)}</b> ডিপোজিট সফলভাবে অনুমোদিত হয়েছে।\n` +
          `বর্তমান ব্যালেন্স: <b>৳${reseller?.balance.toFixed(2)}</b>\n\n` +
          `এখন আপনি VIP লাইসেন্স তৈরি করতে পারবেন।`,
        getResellerReplyKeyboard()
      );
      return;
    }

    // ================= DEPOSIT REJECTION WITH IMMEDIATE RESELLER NOTIFICATION =================
    if (data.startsWith('admin_reject_dep_')) {
      const depId = parseInt(data.replace('admin_reject_dep_', ''));
      const dep = botMemory.deposits.get(depId);

      if (dep) {
        dep.status = 'rejected';
        await saveDepositToSupabase(dep);

        // SEND IMMEDIATE NOTIFICATION TO THE RESELLER
        await sendTgMessage(
          dep.telegram_id,
          `❌ <b>Deposit Request Rejected!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `দুঃখিত, আপনার ডিপোজিট রিকোয়েস্টটি এডমিন কর্তৃক বাতিল (Rejected) করা হয়েছে।\n\n` +
            `🆔 <b>Deposit ID:</b> #${dep.id}\n` +
            `💳 <b>Method:</b> ${dep.method}\n` +
            `💰 <b>Amount:</b> ৳${dep.amount.toFixed(2)} BDT\n` +
            `🔢 <b>TrxID:</b> <code>${dep.transaction_id}</code>\n` +
            `📱 <b>Sender:</b> <code>${dep.sender}</code>\n\n` +
            `⚠️ কোনো তথ্য ভুল থাকলে বা বিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন:`,
          {
            inline_keyboard: [
              [{ text: '💬 Contact Admin (@IshakVhai)', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
              [{ text: '💵 Submit New Deposit', callback_data: 'dep_method_bkash' }],
            ],
          }
        );
      }

      await answerCallback(queryId, '❌ Deposit Rejected & Reseller Notified', true);
      await editTgMessage(
        chatId,
        messageId,
        `❌ <b>Deposit #${depId} Rejected!</b>\n` +
          `রিসেলারকে তাৎক্ষণিক রিজেকশন নোটিফিকেশন পাঠানো হয়েছে।`
      );
      return;
    }

    if (data === 'change_bkash_setting') {
      botMemory.userStates.set(userId, { flow: 'UPDATE_BKASH' });
      await answerCallback(queryId);
      await sendTgMessage(chatId, `🔴 নতুন <b>bKash Personal নম্বর</b> লিখে পাঠান:`);
      return;
    }

    if (data === 'change_binance_setting') {
      botMemory.userStates.set(userId, { flow: 'UPDATE_BINANCE' });
      await answerCallback(queryId);
      await sendTgMessage(chatId, `🟡 নতুন <b>Binance Pay ID</b> লিখে পাঠান:`);
      return;
    }
  }
}

// ==============================================================================
// 10. POLLING ENGINE (ACTIVE NODE SERVER)
// ==============================================================================

let isPolling = true;
let updateOffset = 0;

export async function startBotPolling() {
  console.log('🚀 TradePilot Telegram Bot Polling Engine Started (Active Node Runner v4.0)...');

  // Sync state from Supabase table 'ishak_bot_data'
  await syncFromSupabase();

  // Reset any leftover webhook first
  await tgCall('deleteWebhook', { drop_pending_updates: false });

  await tgCall('setMyCommands', {
    commands: [
      { command: 'start', description: 'বট মেনু ও ড্যাশবোর্ড' },
      { command: 'menu', description: 'মেইন মেনু' },
      { command: 'help', description: 'সহায়তা ও সাপোর্ট' },
    ],
  });

  while (isPolling) {
    try {
      const res = await tgCall('getUpdates', {
        offset: updateOffset + 1,
        timeout: 20,
        allowed_updates: ['message', 'callback_query'],
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          updateOffset = update.update_id;
          if (update.message) {
            onMessage(update.message).catch((e: any) => console.error('Message error:', e.message));
          } else if (update.callback_query) {
            onCallback(update.callback_query).catch((e: any) => console.error('Callback error:', e.message));
          }
        }
      } else if (res && res.error_code === 409) {
        console.warn('Conflict 409: retrying in 3s...');
        await sleep(3000);
      } else {
        await sleep(2000);
      }
    } catch (err: any) {
      console.warn('Polling loop retry in 4s:', err.message);
      await sleep(4000);
    }
  }
}

export function stopBotPolling() {
  isPolling = false;
}
