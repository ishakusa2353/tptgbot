/**
 * ==============================================================================
 * TRADEPILOT TELEGRAM RESELLER MANAGEMENT BOT - CORE ENGINE
 * Real-time Supabase integration, Dual Keyboard Architecture & Strict Reseller Access Control
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

// ----------------- TELEGRAM API HELPERS -----------------
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

// ----------------- KEYBOARD BUILDERS -----------------
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
      [{ text: '➕ Add Reseller' }, { text: '💰 Deposit Requests' }],
      [{ text: '🔑 License Manager' }, { text: '📊 Bot Statistics' }],
      [{ text: '📢 Broadcast' }, { text: '⚙️ Payment Settings' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function getResellerInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔑 Generate VIP License', callback_data: 'rsl_gen_license' },
        { text: '💳 My Balance', callback_data: 'rsl_balance' },
      ],
      [
        { text: '📜 My Licenses', callback_data: 'rsl_my_licenses' },
        { text: '💵 Deposit Request', callback_data: 'rsl_deposit' },
      ],
      [
        { text: '🔄 Device Reset', callback_data: 'rsl_device_reset' },
        { text: '💬 Support', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` },
      ],
    ],
  };
}

export function getOwnerInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '➕ Add Reseller Manually', callback_data: 'admin_add_reseller' },
        { text: '👥 Manage Resellers', callback_data: 'admin_resellers' },
      ],
      [
        { text: '💰 Deposit Requests', callback_data: 'admin_deposits' },
        { text: '🔑 License Manager', callback_data: 'admin_licenses' },
      ],
      [
        { text: '📊 Bot Statistics', callback_data: 'admin_stats' },
        { text: '⚙️ Payment Settings', callback_data: 'admin_payment_settings' },
      ],
      [
        { text: '📢 Broadcast Message', callback_data: 'admin_broadcast' },
        { text: '🔄 Refresh Panel', callback_data: 'owner_home' },
      ],
    ],
  };
}

// ----------------- SUPABASE LICENSE GENERATOR -----------------
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
          exp: null, // Countdown starts upon first login in the bot
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

// ----------------- MESSAGE DISPATCHER -----------------
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

  // Handle active input states
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

  // Bottom Persistent Keyboard Handlers
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
          `🏷️ <b>Reseller Code:</b> <code>${r.reseller_code}</code>\n` +
          `💰 <b>Available Balance:</b> <b>৳${r.balance.toFixed(2)} BDT</b> (≈ $${(r.balance / 125).toFixed(2)} USD)\n` +
          `📥 <b>Total Deposited:</b> ৳${r.total_deposited.toFixed(2)}\n` +
          `🔑 <b>Total Generated Licenses:</b> ${r.total_licenses}`,
        {
          inline_keyboard: [
            [{ text: '💵 Deposit Request', callback_data: 'rsl_deposit' }],
            [{ text: '🔑 Generate VIP License', callback_data: 'rsl_gen_license' }],
          ],
        }
      );
      return;
    }
  }

  if (text === '📜 My Licenses') {
    if (isApprovedReseller || isOwner) {
      await showResellerLicenses(chatId, reseller || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!);
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
      await showDeviceResetMenu(chatId);
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
      await sendTgMessage(chatId, `👑 <b>TradePilot Owner Admin Panel</b>`, getOwnerInlineKeyboard());
      return;
    }
    if (text === '➕ Add Reseller') {
      await startAddReseller(chatId, userId);
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

  // /start or /menu command
  if (text.startsWith('/start') || text === '/menu') {
    if (isOwner) {
      await sendTgMessage(
        chatId,
        `👑 <b>স্বাগতম OWNER ADMIN PANEL-এ!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🛡️ <b>TradePilot Reseller Management System</b>\n` +
          `👤 <b>Owner ID:</b> <code>${BOT_CONFIG.OWNER_ID}</code>\n` +
          `📡 <b>Official Channel:</b> ${BOT_CONFIG.OFFICIAL_CHANNEL}\n\n` +
          `নিচের মেনু বা কিবোর্ড থেকে সিস্টেম পরিচালনা করুন:`,
        getOwnerReplyKeyboard()
      );
      await sendTgMessage(chatId, `⚡ <b>Quick Actions:</b>`, getOwnerInlineKeyboard());
      return;
    }

    if (isApprovedReseller) {
      await sendTgMessage(
        chatId,
        `💼 <b>Welcome to TradePilot Reseller Dashboard!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Reseller Code:</b> <code>${reseller.reseller_code}</code>\n` +
          `💰 <b>Current Balance:</b> <b>৳${reseller.balance.toFixed(2)}</b>\n` +
          `🔑 <b>Generated Licenses:</b> ${reseller.total_licenses}\n` +
          `🛡️ <b>Status:</b> 🟢 Active Authorized Reseller\n\n` +
          `VIP লাইসেন্স তৈরি, ডিপোজিট এবং ডিভাইস রিসেটের জন্য নিচের অপশনগুলো ব্যবহার করুন:`,
        getResellerReplyKeyboard()
      );
      await sendTgMessage(chatId, `⚡ <b>Reseller Controls:</b>`, getResellerInlineKeyboard());
      return;
    }

    // 🛑 STRICT GUEST / NON-RESELLER ACCESS DENIED
    await sendTgMessage(
      chatId,
      `⛔ <b>Access Denied!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n\n` +
        `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য সরাসরি এডমিনের সাথে যোগাযোগ করুন।`,
      {
        inline_keyboard: [
          [{ text: '📩 Contact Admin / রিসেলার আবেদন', url: `https://t.me/${BOT_CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
        ],
      }
    );
  }
}

// ----------------- SUB-MENUS & HELPERS -----------------
export async function showDepositMethods(chatId: number) {
  await sendTgMessage(
    chatId,
    `💵 <b>TradePilot Deposit Portal</b>\n` +
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
      text: `⚡ ${pkg.name} — ৳${pkg.price_bdt} ($${pkg.price_usd})`,
      callback_data: `buy_vip_pkg_${pkg.id}`,
    },
  ]);

  await sendTgMessage(
    chatId,
    `🔑 <b>Generate VIP Trading Bot License</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `যে প্যাকেজের লাইসেন্স তৈরি করতে চান তা নির্বাচন করুন।\n` +
      `প্যাকেজ মূল্য আপনার ব্যালেন্স থেকে কর্তন হবে এবং সাথে সাথে Supabase-এ <b>VIP Tier</b> কী সক্রিয় হবে:`,
    { inline_keyboard: buttons }
  );
}

export async function showResellerLicenses(chatId: number, reseller: ResellerAccount) {
  try {
    const { data: licenses } = await supabase
      .from('ishak_licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (!licenses || licenses.length === 0) {
      await sendTgMessage(chatId, `📜 আপনার কোনো লাইসেন্স পাওয়া যায়নি।`);
      return;
    }

    let text = `📜 <b>My TradePilot Licenses (Recent 8)</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    licenses.forEach((l: any, idx: number) => {
      text += `<b>${idx + 1}.</b> <code>${l.key}</code>\n`;
      text += `   💎 Tier: <b>${l.tier}</b> | ⏱️ ${l.duration}\n`;
      text += `   📱 Device: ${l.device_id ? '🔒 Bound' : '🟢 Unbound (Ready)'}\n`;
      text += `   🛡️ Status: ${l.active ? 'Active' : 'Blocked'}\n\n`;
    });

    await sendTgMessage(chatId, text, {
      inline_keyboard: [[{ text: '🔄 Device Reset', callback_data: 'rsl_device_reset' }]],
    });
  } catch (e: any) {
    await sendTgMessage(chatId, `ত্রুটি: লাইসেন্স লোড করা সম্ভব হয়নি।`);
  }
}

export async function showDeviceResetMenu(chatId: number) {
  try {
    const { data: boundLicenses } = await supabase
      .from('ishak_licenses')
      .select('*')
      .not('device_id', 'is', null)
      .limit(6);

    if (!boundLicenses || boundLicenses.length === 0) {
      await sendTgMessage(chatId, `ℹ️ এই মুহূর্তে কোনো লাইসেন্সে ডিভাইস বাইন্ড নেই। ক্লায়েন্ট ট্রেডিং বটে লগইন করলে ডিভাইস লক হয়।`);
      return;
    }

    const buttons = boundLicenses.map((l: any) => [
      { text: `🔄 Reset: ${l.key.slice(0, 16)}...`, callback_data: `reset_device_key_${l.key}` },
    ]);

    await sendTgMessage(
      chatId,
      `🔄 <b>Device Reset (HWID Unbind)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `ক্লায়েন্টের ডিভাইস পরিবর্তন বা সমস্যার ক্ষেত্রে ডিভাইস আনবাইন্ড করতে লাইসেন্স নির্বাচন করুন:`,
      { inline_keyboard: buttons }
    );
  } catch (e: any) {
    await sendTgMessage(chatId, `ত্রুটি: ডিভাইস রিসেট তালিকা লোড করা যায়নি।`);
  }
}

export async function startAddReseller(chatId: number, userId: number) {
  botMemory.userStates.set(userId, { flow: 'ADD_RESELLER', step: 'ASK_TARGET' });
  await sendTgMessage(
    chatId,
    `➕ <b>Manual Reseller Addition</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `নতুন রিসেলারের <b>Telegram Chat ID</b> অথবা <b>Username</b> (@ সহ বা ছাড়া) লিখে পাঠান:\n\n` +
      `<i>(উদাহরণ: 8274806813 অথবা @IshakVhai)</i>`
  );
}

export async function showResellersList(chatId: number) {
  const resellers = Array.from(botMemory.resellers.values());
  let text = `👥 <b>Active Resellers List (${resellers.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

  resellers.forEach((r) => {
    text += `• <b>${r.reseller_code}</b> | TG: <code>${r.telegram_id}</code>\n`;
    text += `  💰 Balance: <b>৳${r.balance.toFixed(2)}</b> | Total Generated: ${r.total_licenses}\n\n`;
  });

  await sendTgMessage(chatId, text, {
    inline_keyboard: [
      [{ text: '➕ Add Reseller', callback_data: 'admin_add_reseller' }],
      [{ text: '🔙 Owner Menu', callback_data: 'owner_home' }],
    ],
  });
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
        { text: `❌ Reject`, callback_data: `admin_reject_dep_${d.id}` },
      ]);
    });
  }
  buttons.push([{ text: '🔙 Owner Menu', callback_data: 'owner_home' }]);
  await sendTgMessage(chatId, text, { inline_keyboard: buttons });
}

export async function showLicenseManager(chatId: number) {
  const { count } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true });
  await sendTgMessage(
    chatId,
    `🔑 <b>Supabase License Manager</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `মোট লাইসেন্স সংখ্যা: <b>${count || 0}</b> টি\n` +
      `টেবিল: <code>ishak_licenses</code>\n` +
      `URL: <code>${BOT_CONFIG.SUPABASE_URL}</code>\n\n` +
      `রিসেলারদের সকল তৈরি করা লাইসেন্স সরাসরি Supabase ক্লাউডে সিঙ্ক হচ্ছে।`,
    { inline_keyboard: [[{ text: '🔙 Owner Menu', callback_data: 'owner_home' }]] }
  );
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
      `💰 <b>Total Deposit Volume:</b> ৳${totalVolume.toFixed(2)}\n` +
      `🔑 <b>Supabase Total Licenses:</b> ${totalLicenses || 0} টি\n` +
      `🕒 <b>Engine:</b> 🟢 Live Connected to Supabase`,
    { inline_keyboard: [[{ text: '🔙 Owner Menu', callback_data: 'owner_home' }]] }
  );
}

export async function showPaymentSettings(chatId: number) {
  await sendTgMessage(
    chatId,
    `⚙️ <b>Payment Gateways Configuration</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 <b>bKash Personal:</b> <code>${botMemory.paymentSettings.bkash}</code>\n` +
      `🟡 <b>Binance Pay ID:</b> <code>${botMemory.paymentSettings.binancePayId}</code>\n\n` +
      `পরিবর্তন করতে নিচের অপশন নির্বাচন করুন:`,
    {
      inline_keyboard: [
        [{ text: '✏️ Edit bKash Number', callback_data: 'change_bkash_setting' }],
        [{ text: '✏️ Edit Binance Pay ID', callback_data: 'change_binance_setting' }],
        [{ text: '🔙 Owner Menu', callback_data: 'owner_home' }],
      ],
    }
  );
}

export async function startBroadcast(chatId: number, userId: number) {
  botMemory.userStates.set(userId, { flow: 'BROADCAST' });
  await sendTgMessage(
    chatId,
    `📢 <b>Broadcast Announcement</b>\n` +
      `বটের সকল ব্যবহারকারীদের কাছে যে বার্তা পাঠাতে চান তা লিখে পাঠিয়ে দিন:`
  );
}

// ----------------- STATE HANDLER -----------------
async function handleState(userId: number, chatId: number, text: string, state: any) {
  // Manual Add Reseller
  if (state.flow === 'ADD_RESELLER' && userId === BOT_CONFIG.OWNER_ID) {
    if (state.step === 'ASK_TARGET') {
      const clean = text.trim().replace('@', '');
      const parsed = parseInt(clean);
      state.targetId = isNaN(parsed) ? clean : parsed;
      state.step = 'ASK_BALANCE';
      botMemory.userStates.set(userId, state);
      await sendTgMessage(chatId, `💰 নতুন রিসেলারের জন্য <b>Initial Balance (BDT)</b> লিখুন (যেমন: 0 বা 1000):`);
      return;
    }

    if (state.step === 'ASK_BALANCE') {
      const initialBalance = parseFloat(text) || 0.0;
      botMemory.userStates.delete(userId);

      const resellerId = typeof state.targetId === 'number' ? state.targetId : Math.floor(10000000 + Math.random() * 90000000);
      const resellerCode = `TP-RSL-${Math.floor(1000 + Math.random() * 9000)}`;

      const newReseller: ResellerAccount = {
        id: botMemory.resellers.size + 1,
        telegram_id: resellerId,
        username: typeof state.targetId === 'string' ? state.targetId : '',
        reseller_code: resellerCode,
        business_name: `Reseller ${resellerCode}`,
        balance: initialBalance,
        total_deposited: initialBalance,
        total_licenses: 0,
        status: 'active',
        created_at: new Date(),
      };
      botMemory.resellers.set(resellerId, newReseller);

      await sendTgMessage(
        chatId,
        `✅ <b>Reseller Added Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Reseller Code:</b> <code>${resellerCode}</code>\n` +
          `🆔 <b>Telegram ID:</b> <code>${resellerId}</code>\n` +
          `💰 <b>Opening Balance:</b> ৳${initialBalance.toFixed(2)}\n` +
          `🛡️ <b>Status:</b> 🟢 Active Authorized Reseller`
      );

      if (typeof resellerId === 'number') {
        await sendTgMessage(
          resellerId,
          `🎉 <b>Congratulations!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `আপনাকে <b>TradePilot Official Reseller</b> হিসেবে অনুমোদন করা হয়েছে!\n\n` +
            `🏷️ <b>Reseller Code:</b> <code>${resellerCode}</code>\n` +
            `💰 <b>Opening Balance:</b> ৳${initialBalance.toFixed(2)}\n\n` +
            `ড্যাশবোর্ড ব্যবহারের জন্য এখনই <b>/start</b> পাঠান!`,
          getResellerReplyKeyboard()
        );
      }
      return;
    }
  }

  // Deposit Workflow
  if (state.flow === 'DEPOSIT') {
    if (state.step === 'ASK_AMOUNT') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
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
        reseller_code: reseller.reseller_code,
        method: state.method,
        amount: state.amount,
        transaction_id: state.trxId,
        sender,
        status: 'pending',
        created_at: new Date(),
      };
      botMemory.deposits.set(depId, depositRecord);

      await sendTgMessage(
        chatId,
        `✅ <b>Deposit Request Submitted Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Deposit ID:</b> #${depId}\n` +
          `💳 <b>Method:</b> ${state.method}\n` +
          `💰 <b>Amount:</b> ৳${state.amount.toFixed(2)}\n` +
          `🔢 <b>TrxID:</b> <code>${state.trxId}</code>\n` +
          `📱 <b>Sender:</b> ${sender}\n` +
          `⏳ <b>Status:</b> 🟡 Pending Admin Verification`,
        { inline_keyboard: [[{ text: '💳 Check Balance', callback_data: 'rsl_balance' }]] }
      );

      // Alert Owner
      await sendTgMessage(
        BOT_CONFIG.OWNER_ID,
        `💰 <b>নতুন DEPOSIT রিকোয়েস্ট এসেছে!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>ID:</b> #${depId}\n` +
          `👤 <b>Reseller:</b> <code>${reseller.reseller_code}</code> (TG: ${userId})\n` +
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
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>${botMemory.paymentSettings.bkash}</code>`);
    return;
  }

  if (state.flow === 'UPDATE_BINANCE' && userId === BOT_CONFIG.OWNER_ID) {
    botMemory.paymentSettings.binancePayId = text.trim();
    botMemory.userStates.delete(userId);
    await sendTgMessage(chatId, `✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>${botMemory.paymentSettings.binancePayId}</code>`);
    return;
  }
}

// ----------------- CALLBACK ROUTER -----------------
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
      if (userId === BOT_CONFIG.OWNER_ID || (reseller && reseller.status === 'active')) {
        await editTgMessage(
          chatId,
          messageId,
          `🎉 <b>ভেরিফিকেশন সফল!</b>\nড্যাশবোর্ড ব্যবহারের জন্য নিচের বাটন চাপুন:`,
          getResellerInlineKeyboard()
        );
      } else {
        await editTgMessage(
          chatId,
          messageId,
          `⛔ <b>Access Denied!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n\n` +
            `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য সরাসরি এডমিনের সাথে যোগাযোগ করুন।`,
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

  // Reseller Actions
  if (data === 'rsl_balance') {
    const r = botMemory.resellers.get(userId) || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!;
    await answerCallback(queryId);
    await editTgMessage(
      chatId,
      messageId,
      `💳 <b>My Balance Information</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ <b>Reseller Code:</b> <code>${r.reseller_code}</code>\n` +
        `💰 <b>Available Balance:</b> <b>৳${r.balance.toFixed(2)} BDT</b> (≈ $${(r.balance / 125).toFixed(2)} USD)\n` +
        `📥 <b>Total Deposited:</b> ৳${r.total_deposited.toFixed(2)}\n` +
        `🔑 <b>Total Generated Licenses:</b> ${r.total_licenses}`,
      {
        inline_keyboard: [
          [{ text: '💵 Deposit Request', callback_data: 'rsl_deposit' }],
          [{ text: '🔑 Generate VIP License', callback_data: 'rsl_gen_license' }],
        ],
      }
    );
    return;
  }

  if (data === 'rsl_deposit') {
    await answerCallback(queryId);
    await editTgMessage(
      chatId,
      messageId,
      `💵 <b>Deposit Payment Method</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `পেমেন্ট মাধ্যম বেছে নিন:\n\n` +
        `🔴 <b>bKash Personal:</b> <code>${botMemory.paymentSettings.bkash}</code>\n` +
        `🟡 <b>Binance Pay / USDT:</b> <code>${botMemory.paymentSettings.binancePayId}</code>`,
      {
        inline_keyboard: [
          [{ text: '🔴 bKash Personal', callback_data: 'dep_method_bkash' }],
          [{ text: '🟡 Binance Pay / USDT', callback_data: 'dep_method_binance' }],
        ],
      }
    );
    return;
  }

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

  if (data === 'rsl_gen_license') {
    await answerCallback(queryId);
    await showPackageSelection(chatId);
    return;
  }

  // VIP License Purchase Execution
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
          `অনুগ্রহ করে প্রথমে ব্যালেন্স ডিপোজিট করুন।`,
        {
          inline_keyboard: [[{ text: '💵 Deposit Request', callback_data: 'rsl_deposit' }]],
        }
      );
      return;
    }

    await answerCallback(queryId, '⚡ VIP লাইসেন্স তৈরি হচ্ছে...');

    reseller.balance -= pkg.price_bdt;
    reseller.total_licenses += 1;

    const res = await createSupabaseVipLicense({
      durationDays: pkg.duration_days,
      durationCode: pkg.duration_code,
      resellerCode: reseller.reseller_code,
    });

    if (!res.success) {
      reseller.balance += pkg.price_bdt;
      reseller.total_licenses -= 1;
      await editTgMessage(chatId, messageId, `❌ লাইসেন্স তৈরিতে সমস্যা: ${res.error}`);
      return;
    }

    const licenseKey = res.license.key;

    // Delivery message formatted exactly as requested
    const deliveryText =
      `⚡ <b>TRADEPILOT - LICENSE DELIVERY</b> ⚡\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Congratulations! Your TradePilot Trading Bot License is ready.\n\n` +
      `🔑 <b>License Key:</b> <code>${licenseKey}</code>\n` +
      `💎 <b>Membership Tier:</b> VIP\n` +
      `⏱️ <b>Time Limit:</b> ${pkg.duration_days} Days\n` +
      `⌛ <b>Expiry Status:</b> Countdown starts upon first login in the bot\n` +
      `📱 <b>Device Limit:</b> 1 Device\n` +
      `👤 <b>Reseller:</b> ${reseller.reseller_code}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 <b>How to Activate & Trade in Quotex:</b>\n` +
      `1. Open Quotex in Browser.\n` +
      `2. Launch the TradePilot Trading Bot widget on your chart.\n` +
      `3. Click the Bot Logo / VIP Key button.\n` +
      `4. Enter your VIP License Key and click "Verify & Unlock".\n` +
      `5. Choose your desired Timeframe to start receiving 1-trade auto signals!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 <i>অবশিষ্ট ব্যালেন্স: ৳${reseller.balance.toFixed(2)}</i>`;

    await editTgMessage(chatId, messageId, deliveryText, {
      inline_keyboard: [
        [{ text: '🔑 আরেকটি কী তৈরি করুন', callback_data: 'rsl_gen_license' }],
        [{ text: '📜 My Licenses', callback_data: 'rsl_my_licenses' }],
      ],
    });
    return;
  }

  if (data === 'rsl_my_licenses') {
    const reseller = botMemory.resellers.get(userId) || botMemory.resellers.get(BOT_CONFIG.OWNER_ID)!;
    await answerCallback(queryId);
    await showResellerLicenses(chatId, reseller);
    return;
  }

  if (data === 'rsl_device_reset') {
    await answerCallback(queryId);
    await showDeviceResetMenu(chatId);
    return;
  }

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
            `পূর্ববর্তী Device Binding আনলক করা হয়েছে। ক্লায়েন্ট এখন নতুন ডিভাইসে লগইন করতে পারবেন।`
        );
      }
    } catch (e: any) {
      await answerCallback(queryId, 'ব্যর্থ হয়েছে', true);
    }
    return;
  }

  // Admin Callbacks
  if (userId === BOT_CONFIG.OWNER_ID) {
    if (data === 'owner_home') {
      await answerCallback(queryId);
      await editTgMessage(chatId, messageId, `👑 <b>TradePilot Owner Admin Panel</b>`, getOwnerInlineKeyboard());
      return;
    }

    if (data === 'admin_add_reseller') {
      await answerCallback(queryId);
      await startAddReseller(chatId, userId);
      return;
    }

    if (data === 'admin_resellers') {
      await answerCallback(queryId);
      await showResellersList(chatId);
      return;
    }

    if (data === 'admin_deposits') {
      await answerCallback(queryId);
      await showPendingDeposits(chatId);
      return;
    }

    if (data.startsWith('admin_approve_dep_')) {
      const depId = parseInt(data.replace('admin_approve_dep_', ''));
      const dep = botMemory.deposits.get(depId);

      if (!dep || dep.status !== 'pending') {
        await answerCallback(queryId, 'ডিপোজিট ইতিমধ্যে প্রসেস হয়েছে!', true);
        return;
      }

      dep.status = 'approved';
      const reseller = botMemory.resellers.get(dep.telegram_id);
      if (reseller) {
        reseller.balance += dep.amount;
        reseller.total_deposited += dep.amount;
      }

      await answerCallback(queryId, '✅ Deposit Approved!', true);
      await editTgMessage(
        chatId,
        messageId,
        `✅ <b>Deposit #${depId} Approved!</b>\nপরিমাণ: ৳${dep.amount}\nরিসেলার ${dep.reseller_code}-এর নতুন ব্যালেন্স: ৳${reseller?.balance.toFixed(2)}`
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

    if (data.startsWith('admin_reject_dep_')) {
      const depId = parseInt(data.replace('admin_reject_dep_', ''));
      const dep = botMemory.deposits.get(depId);
      if (dep) dep.status = 'rejected';
      await answerCallback(queryId, '❌ Deposit Rejected', true);
      await editTgMessage(chatId, messageId, `❌ Deposit #${depId} বাতিল (Rejected) করা হয়েছে।`);
      return;
    }

    if (data === 'admin_licenses') {
      await answerCallback(queryId);
      await showLicenseManager(chatId);
      return;
    }

    if (data === 'admin_stats') {
      await answerCallback(queryId);
      await showBotStatistics(chatId);
      return;
    }

    if (data === 'admin_payment_settings') {
      await answerCallback(queryId);
      await showPaymentSettings(chatId);
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

    if (data === 'admin_broadcast') {
      await answerCallback(queryId);
      await startBroadcast(chatId, userId);
      return;
    }
  }
}

// ----------------- POLLING ENGINE -----------------
let isPolling = true;
let updateOffset = 0;

export async function startBotPolling() {
  console.log('🚀 TradePilot Telegram Bot Polling Engine Started for @trade_pilotrobot...');

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
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err: any) {
      console.warn('Polling loop retry in 5s:', err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

export function stopBotPolling() {
  isPolling = false;
}
