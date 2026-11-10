/**
 * ==============================================================================
 * TRADEPILOT TELEGRAM RESELLER MANAGEMENT BOT
 * Standalone Production Application for GitHub & Render Web Service
 *
 * Connected Systems:
 * - Supabase: "ishak_licenses" Table (Realtime VIP License Engine)
 * - Telegram Bot: @trade_pilotrobot (Token: 9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ)
 * - Owner ID: 8274806813
 * - Official Channel: @trade_pilotbot
 * - Support: @IshakVhai
 * - bKash Personal: 01606398924
 * ==============================================================================
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 3000,
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ',
  OWNER_ID: 8274806813,
  OFFICIAL_CHANNEL: process.env.OFFICIAL_CHANNEL || '@trade_pilotbot',
  SUPPORT_USERNAME: process.env.SUPPORT_USERNAME || '@IshakVhai',
  BKASH_NUMBER: process.env.BKASH_NUMBER || '01606398924',
  BINANCE_PAY_ID: process.env.BINANCE_PAY_ID || '827480681',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://qbazzarqiplrqqfytajz.supabase.co',
  SUPABASE_KEY:
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo',
};

// 1. Initialize Express App for Render Health Check
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'TradePilot Reseller Management Bot',
    version: '3.0.0',
    owner: CONFIG.OWNER_ID.toString(),
    channel: CONFIG.OFFICIAL_CHANNEL,
    supabase: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// 2. Initialize Supabase Client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// 3. In-Memory Store & Dynamic Packages
const store = {
  users: new Map(), // telegram_id -> user
  resellers: new Map(), // telegram_id -> reseller
  deposits: new Map(), // deposit_id -> deposit
  userStates: new Map(), // telegram_id -> multi-step state
  packages: [
    { id: 1, name: 'Starter Plan (20 Days)', duration_days: 20, duration_code: '20d', price_usd: 4.0, price_bdt: 500.0 },
    { id: 2, name: 'Standard Plan (30 Days)', duration_days: 30, duration_code: '30d', price_usd: 6.0, price_bdt: 750.0 },
    { id: 3, name: 'Pro Plan (45 Days)', duration_days: 45, duration_code: '45d', price_usd: 8.0, price_bdt: 1000.0 },
    { id: 4, name: 'Elite Plan (60 Days)', duration_days: 60, duration_code: '60d', price_usd: 14.0, price_bdt: 1750.0 },
  ],
  paymentSettings: {
    bkash: CONFIG.BKASH_NUMBER,
    binancePayId: CONFIG.BINANCE_PAY_ID,
  },
};

// Seed Owner as Default Master Reseller
store.resellers.set(CONFIG.OWNER_ID, {
  id: 1,
  telegram_id: CONFIG.OWNER_ID,
  username: 'IshakVhai',
  reseller_code: 'TP-RSL-OWNER',
  business_name: 'Ishak Master Admin',
  balance: 100000.0,
  total_deposited: 100000.0,
  total_licenses: 10,
  status: 'active',
  created_at: new Date(),
});

// 4. Telegram Bot API Methods
const TELEGRAM_API = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}`;

async function tgRequest(method, payload = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API Error (${method}):`, err.message);
    return { ok: false, description: err.message };
  }
}

async function sendTg(chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId.toString(),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tgRequest('sendMessage', payload);
}

async function editTg(chatId, messageId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId.toString(),
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await tgRequest('editMessageText', payload);
}

async function answerCb(queryId, text = '', showAlert = false) {
  return await tgRequest('answerCallbackQuery', {
    callback_query_id: queryId,
    text,
    show_alert: showAlert,
  });
}

// 5. Channel Membership Verification (@trade_pilotbot)
async function verifyChannelMembership(userId) {
  if (userId === CONFIG.OWNER_ID) return true;
  try {
    const res = await tgRequest('getChatMember', {
      chat_id: CONFIG.OFFICIAL_CHANNEL,
      user_id: userId.toString(),
    });
    if (res.ok && res.result) {
      const status = res.result.status;
      return ['creator', 'administrator', 'member', 'restricted'].includes(status);
    }
  } catch (e) {
    console.warn('Channel check error:', e.message);
  }
  return true;
}

// 6. Keyboards (Both Persistent Bottom Keyboards & Inline Menus)

// Persistent bottom keyboard for Resellers
function getResellerReplyKeyboard() {
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

// Persistent bottom keyboard for Owner Admin
function getOwnerReplyKeyboard() {
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

// Remove keyboard for Guests
function getRemoveKeyboard() {
  return { remove_keyboard: true };
}

// Inline menu for Reseller Dashboard
function getResellerInlineKeyboard() {
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
        { text: '💬 Support', url: `https://t.me/${CONFIG.SUPPORT_USERNAME.replace('@', '')}` },
      ],
    ],
  };
}

// Inline menu for Owner Admin
function getOwnerInlineKeyboard() {
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

// 7. Supabase VIP License Operations
function generateVipLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `TP-VIP-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
}

async function insertSupabaseVipLicense({ durationDays, durationCode, resellerCode }) {
  const key = generateVipLicenseKey();
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
      console.error('Supabase License Insert Error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, license: data || { key, duration: durationCode, duration_days: durationDays } };
  } catch (err) {
    console.error('Supabase Exception:', err.message);
    return { success: false, error: err.message };
  }
}

// 8. Core Bot Message Dispatcher
async function handleMessage(msg) {
  if (!msg || !msg.chat) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text ? msg.text.trim() : '';
  const firstName = msg.from.first_name || '';
  const username = msg.from.username || '';

  // Record user
  store.users.set(userId, {
    telegram_id: userId,
    first_name: firstName,
    username,
    last_active: new Date(),
  });

  // Handle active multi-step input states (deposit, add reseller, broadcast, payment update)
  const state = store.userStates.get(userId);
  if (state) {
    await handleState(userId, chatId, text, state);
    return;
  }

  // 1. Channel Membership Verification (Owner bypasses)
  const isChannelMember = await verifyChannelMembership(userId);
  if (!isChannelMember && userId !== CONFIG.OWNER_ID) {
    await sendTg(
      chatId,
      `👋 <b>স্বাগতম TradePilot Reseller Bot-এ!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `বটটি ব্যবহারের জন্য আপনাকে প্রথমে আমাদের অফিসিয়াল চ্যানেল <b>${CONFIG.OFFICIAL_CHANNEL}</b>-এ জয়েন হতে হবে।\n\n` +
        `নিচের বাটনে ক্লিক করে জয়েন করার পর <b>"✅ Verify Membership / যাচাই করুন"</b> বাটনে চাপুন:`,
      {
        inline_keyboard: [
          [{ text: '📢 Join Official Channel', url: `https://t.me/${CONFIG.OFFICIAL_CHANNEL.replace('@', '')}` }],
          [{ text: '✅ Verify Membership / যাচাই করুন', callback_data: 'check_channel_join' }],
        ],
      }
    );
    return;
  }

  // 2. Routing based on Role: Owner vs Approved Reseller vs Guest
  const isOwner = userId === CONFIG.OWNER_ID;
  const reseller = store.resellers.get(userId);
  const isApprovedReseller = reseller && reseller.status === 'active';

  // Handle Bottom Persistent Keyboard actions
  if (text === '🔑 Generate VIP License') {
    if (isApprovedReseller || isOwner) {
      await showPackageSelection(chatId);
      return;
    }
  }

  if (text === '💳 My Balance') {
    if (isApprovedReseller || isOwner) {
      const r = reseller || store.resellers.get(CONFIG.OWNER_ID);
      await sendTg(
        chatId,
        `💳 <b>My Balance Information</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Reseller Code:</b> <code>${r.reseller_code}</code>\n` +
          `💰 <b>Available Balance:</b> <b>৳${r.balance.toFixed(2)} BDT</b> (≈ $${(r.balance / 125).toFixed(2)} USD)\n` +
          `📥 <b>Total Deposited:</b> ৳${r.total_deposited.toFixed(2)}\n` +
          `🔑 <b>Total Generated Licenses:</b> ${r.total_licenses}\n\n` +
          `ব্যালেন্স বৃদ্ধি করতে নিচের "Deposit Request" বাটন ব্যবহার করুন।`,
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
      await showResellerLicenses(chatId, reseller || store.resellers.get(CONFIG.OWNER_ID));
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
      await showDeviceResetMenu(chatId, reseller || store.resellers.get(CONFIG.OWNER_ID));
      return;
    }
  }

  if (text === '💬 Support') {
    await sendTg(
      chatId,
      `💬 <b>TradePilot Official Support</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `যেকোনো সমস্যা বা সহায়তার জন্য সরাসরি যোগাযোগ করুন:\n` +
        `👤 <b>Admin Support:</b> ${CONFIG.SUPPORT_USERNAME}\n` +
        `📢 <b>Official Channel:</b> ${CONFIG.OFFICIAL_CHANNEL}`,
      {
        inline_keyboard: [[{ text: '💬 Contact @IshakVhai', url: `https://t.me/${CONFIG.SUPPORT_USERNAME.replace('@', '')}` }]],
      }
    );
    return;
  }

  // Owner specific bottom keyboard buttons
  if (isOwner) {
    if (text === '👑 Owner Admin Panel') {
      await sendTg(chatId, `👑 <b>TradePilot Owner Admin Panel</b>`, getOwnerInlineKeyboard());
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
      await sendTg(
        chatId,
        `👑 <b>স্বাগতম OWNER ADMIN PANEL-এ!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🛡️ <b>TradePilot Reseller Management System</b>\n` +
          `👤 <b>Owner ID:</b> <code>${CONFIG.OWNER_ID}</code>\n` +
          `📡 <b>Official Channel:</b> ${CONFIG.OFFICIAL_CHANNEL}\n\n` +
          `নিচের মেনু বা কিবোর্ড থেকে সিস্টেম পরিচালনা করুন:`,
        getOwnerReplyKeyboard()
      );
      await sendTg(chatId, `⚡ <b>Quick Actions:</b>`, getOwnerInlineKeyboard());
      return;
    }

    if (isApprovedReseller) {
      await sendTg(
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
      await sendTg(chatId, `⚡ <b>Reseller Controls:</b>`, getResellerInlineKeyboard());
      return;
    }

    // 🛑 GUEST / NON-RESELLER ACCESS DENIED
    // User requested: "এক্সেস ডেইনেড! আপনি রিসেলার নন! রিসেলারের আবেদন করুন"
    // আর কিচ্ছু দেখাবে না! প্যাকেজ বা কোনো কিছু সাধারণ ইউজারকে দেখাবে না!
    await sendTg(
      chatId,
      `⛔ <b>Access Denied!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n\n` +
        `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য সরাসরি এডমিনের সাথে যোগাযোগ করুন।`,
      {
        inline_keyboard: [
          [{ text: '📩 Contact Admin / রিসেলার আবেদন', url: `https://t.me/${CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
        ],
      }
    );
  }
}

// 9. Deposit Flow (bKash & Binance Pay ONLY)
async function showDepositMethods(chatId) {
  await sendTg(
    chatId,
    `💵 <b>TradePilot Deposit Portal</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `ব্যালেন্স রিচার্জের জন্য পেমেন্ট মাধ্যম নির্বাচন করুন:\n\n` +
      `🔴 <b>bKash Personal:</b> <code>${store.paymentSettings.bkash}</code>\n` +
      `🟡 <b>Binance Pay / USDT:</b> <code>${store.paymentSettings.binancePayId}</code>\n\n` +
      `নিচের বাটন চেপে পেমেন্ট সম্পন্ন করুন:`,
    {
      inline_keyboard: [
        [{ text: '🔴 bKash Personal', callback_data: 'dep_method_bkash' }],
        [{ text: '🟡 Binance Pay / USDT', callback_data: 'dep_method_binance' }],
      ],
    }
  );
}

// 10. Package Selection & Real Supabase VIP License Generation
async function showPackageSelection(chatId) {
  const buttons = store.packages.map((pkg) => [
    {
      text: `⚡ ${pkg.name} — ৳${pkg.price_bdt} ($${pkg.price_usd})`,
      callback_data: `buy_vip_pkg_${pkg.id}`,
    },
  ]);

  await sendTg(
    chatId,
    `🔑 <b>Generate VIP Trading Bot License</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `যে প্যাকেজের লাইসেন্স তৈরি করতে চান তা নির্বাচন করুন।\n` +
      `প্যাকেজ মূল্য আপনার ব্যালেন্স থেকে কর্তন হবে এবং সাথে সাথে Supabase-এ <b>VIP Tier</b> কী সক্রিয় হবে:`,
    { inline_keyboard: buttons }
  );
}

// 11. Multi-Step State Handlers
async function handleState(userId, chatId, text, state) {
  // A. Manual Add Reseller by Owner
  if (state.flow === 'ADD_RESELLER' && userId === CONFIG.OWNER_ID) {
    if (state.step === 'ASK_TARGET') {
      const targetInput = text.trim().replace('@', '');
      const parsedId = parseInt(targetInput);

      state.targetId = isNaN(parsedId) ? targetInput : parsedId;
      state.step = 'ASK_BALANCE';
      store.userStates.set(userId, state);

      await sendTg(
        chatId,
        `💰 নতুন রিসেলারের জন্য <b>Initial Balance (BDT)</b> লিখুন (যেমন: 0 বা 1000):`
      );
      return;
    }

    if (state.step === 'ASK_BALANCE') {
      const initialBalance = parseFloat(text) || 0.0;
      store.userStates.delete(userId);

      const resellerId = typeof state.targetId === 'number' ? state.targetId : Math.floor(10000000 + Math.random() * 90000000);
      const resellerCode = `TP-RSL-${Math.floor(1000 + Math.random() * 9000)}`;

      const newReseller = {
        id: store.resellers.size + 1,
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

      store.resellers.set(resellerId, newReseller);

      await sendTg(
        chatId,
        `✅ <b>Reseller Added Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🏷️ <b>Reseller Code:</b> <code>${resellerCode}</code>\n` +
          `🆔 <b>Telegram ID:</b> <code>${resellerId}</code>\n` +
          `💰 <b>Opening Balance:</b> ৳${initialBalance.toFixed(2)}\n` +
          `🛡️ <b>Status:</b> 🟢 Active Authorized Reseller\n\n` +
          `রিসেলার এখন বটে /start চেপে Reseller Dashboard ব্যবহার করতে পারবেন।`
      );

      // Notify the appointed reseller on Telegram if valid ID
      if (typeof resellerId === 'number') {
        await sendTg(
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

  // B. Deposit Flow (bKash & Binance)
  if (state.flow === 'DEPOSIT') {
    if (state.step === 'ASK_AMOUNT') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        await sendTg(chatId, `⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500 বা 1000):`);
        return;
      }
      state.amount = amount;
      state.step = 'ASK_TRXID';
      store.userStates.set(userId, state);

      await sendTg(
        chatId,
        `📝 <b>Transaction ID (TrxID) / Payment ID লিখুন:</b>\n` +
          `<i>টাকা পাঠানোর পর প্রাপ্ত TrxID প্রদান করুন।</i>`
      );
      return;
    }

    if (state.step === 'ASK_TRXID') {
      const trxId = text.trim().toUpperCase();
      if (trxId.length < 5) {
        await sendTg(chatId, `⚠️ সঠিক Transaction ID দিন (কমপক্ষে ৫ অক্ষর):`);
        return;
      }

      // Check for duplicate TrxID
      for (const d of store.deposits.values()) {
        if (d.transaction_id === trxId) {
          await sendTg(
            chatId,
            `❌ <b>এই Transaction ID ইতিপূর্বে ব্যবহার করা হয়েছে!</b>\nদয়া করে সঠিক ও নতুন TrxID প্রদান করুন:`
          );
          return;
        }
      }

      state.trxId = trxId;
      state.step = 'ASK_SENDER';
      store.userStates.set(userId, state);

      await sendTg(
        chatId,
        `📱 <b>Sender Number / Binance Pay ID লিখুন:</b>\n` +
          `যে নম্বর বা আইডি থেকে পেমেন্ট করেছেন তা লিখুন:`
      );
      return;
    }

    if (state.step === 'ASK_SENDER') {
      const sender = text.trim();
      store.userStates.delete(userId);

      const depId = Math.floor(100 + Math.random() * 900);
      const reseller = store.resellers.get(userId) || { reseller_code: `TP-RSL-${userId}` };

      const depositRecord = {
        id: depId,
        telegram_id: userId,
        reseller_code: reseller.reseller_code,
        method: state.method,
        amount: state.amount,
        transaction_id: state.trxId,
        sender: sender,
        status: 'pending',
        created_at: new Date(),
      };
      store.deposits.set(depId, depositRecord);

      await sendTg(
        chatId,
        `✅ <b>Deposit Request Submitted Successfully!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `🆔 <b>Deposit ID:</b> #${depId}\n` +
          `💳 <b>Method:</b> ${state.method}\n` +
          `💰 <b>Amount:</b> ৳${state.amount.toFixed(2)}\n` +
          `🔢 <b>TrxID:</b> <code>${state.trxId}</code>\n` +
          `📱 <b>Sender:</b> ${sender}\n` +
          `⏳ <b>Status:</b> 🟡 Pending Admin Verification\n\n` +
          `এডমিন ভেরিফাই করলেই আপনার ব্যালেন্সে টাকা যুক্ত হবে।`,
        {
          inline_keyboard: [[{ text: '💳 Check Balance', callback_data: 'rsl_balance' }]],
        }
      );

      // Alert Owner with Approve/Reject buttons
      await sendTg(
        CONFIG.OWNER_ID,
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

  // C. Broadcast Message
  if (state.flow === 'BROADCAST' && userId === CONFIG.OWNER_ID) {
    store.userStates.delete(userId);
    await sendTg(chatId, `📡 <b>ব্রডকাস্ট পাঠানো শুরু হচ্ছে...</b>`);

    let sentCount = 0;
    for (const [uId] of store.users) {
      const res = await sendTg(uId, `📢 <b>Official Announcement:</b>\n\n${text}`);
      if (res.ok) sentCount++;
    }

    await sendTg(chatId, `✅ <b>ব্রডকাস্ট সম্পন্ন!</b> মোট ${sentCount} জন ব্যবহারকারীর কাছে মেসেজ পৌঁছেছে।`);
    return;
  }

  // D. Payment Setting Update
  if (state.flow === 'UPDATE_BKASH' && userId === CONFIG.OWNER_ID) {
    store.paymentSettings.bkash = text.trim();
    store.userStates.delete(userId);
    await sendTg(chatId, `✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>${store.paymentSettings.bkash}</code>`);
    return;
  }

  if (state.flow === 'UPDATE_BINANCE' && userId === CONFIG.OWNER_ID) {
    store.paymentSettings.binancePayId = text.trim();
    store.userStates.delete(userId);
    await sendTg(chatId, `✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>${store.paymentSettings.binancePayId}</code>`);
    return;
  }
}

// 12. Callback Query Router
async function handleCallback(cb) {
  const queryId = cb.id;
  const message = cb.message;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  const data = cb.data;
  const userId = cb.from.id;

  // Channel Membership Verify Button
  if (data === 'check_channel_join') {
    const isMember = await verifyChannelMembership(userId);
    if (isMember) {
      await answerCb(queryId, '✅ চ্যানেল ভেরিফিকেশন সফল হয়েছে!', true);

      // Check if Reseller
      const reseller = store.resellers.get(userId);
      if (userId === CONFIG.OWNER_ID || (reseller && reseller.status === 'active')) {
        await editTg(
          chatId,
          messageId,
          `🎉 <b>ভেরিফিকেশন সফল!</b>\nড্যাশবোর্ড ব্যবহারের জন্য নিচের বাটন চাপুন:`,
          getResellerInlineKeyboard()
        );
      } else {
        await editTg(
          chatId,
          messageId,
          `⛔ <b>Access Denied!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\n\n` +
            `রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য সরাসরি এডমিনের সাথে যোগাযোগ করুন।`,
          {
            inline_keyboard: [
              [{ text: '📩 Contact Admin / রিসেলার আবেদন', url: `https://t.me/${CONFIG.SUPPORT_USERNAME.replace('@', '')}` }],
            ],
          }
        );
      }
    } else {
      await answerCb(queryId, '❌ এখনও চ্যানেলে জয়েন পাওয়া যায়নি! অনুগ্রহ করে জয়েন করুন।', true);
    }
    return;
  }

  // Reseller Dashboard Actions
  if (data === 'rsl_balance') {
    const r = store.resellers.get(userId) || store.resellers.get(CONFIG.OWNER_ID);
    await answerCb(queryId);
    await editTg(
      chatId,
      messageId,
      `💳 <b>My Balance Information</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️ <b>Reseller Code:</b> <code>${r?.reseller_code}</code>\n` +
        `💰 <b>Available Balance:</b> <b>৳${r?.balance.toFixed(2)} BDT</b> (≈ $${((r?.balance || 0) / 125).toFixed(2)} USD)\n` +
        `📥 <b>Total Deposited:</b> ৳${r?.total_deposited.toFixed(2)}\n` +
        `🔑 <b>Total Generated Licenses:</b> ${r?.total_licenses}`,
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
    await answerCb(queryId);
    await editTg(
      chatId,
      messageId,
      `💵 <b>Deposit Payment Method</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `পেমেন্ট মাধ্যম বেছে নিন:\n\n` +
        `🔴 <b>bKash Personal:</b> <code>${store.paymentSettings.bkash}</code>\n` +
        `🟡 <b>Binance Pay / USDT:</b> <code>${store.paymentSettings.binancePayId}</code>`,
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
    store.userStates.set(userId, { flow: 'DEPOSIT', method: 'bKash Personal', step: 'ASK_AMOUNT' });
    await answerCb(queryId);
    await sendTg(
      chatId,
      `🔴 <b>bKash Personal Payment Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `নম্বর: <code>${store.paymentSettings.bkash}</code> (Personal - Send Money)\n\n` +
        `১. bKash App থেকে উপরের নম্বরে <b>Send Money</b> করুন।\n` +
        `২. সর্বনিম্ন ডিপোজিট: <b>৳৫০০ BDT</b>\n\n` +
        `টাকা পাঠানোর পর আপনি কত টাকা পাঠিয়েছেন তা সংখ্যায় লিখে পাঠান (যেমন: 500, 1000):`
    );
    return;
  }

  if (data === 'dep_method_binance') {
    store.userStates.set(userId, { flow: 'DEPOSIT', method: 'Binance Pay / USDT', step: 'ASK_AMOUNT' });
    await answerCb(queryId);
    await sendTg(
      chatId,
      `🟡 <b>Binance Pay / USDT Payment Guide</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `Binance Pay ID: <code>${store.paymentSettings.binancePayId}</code>\n\n` +
        `১. Binance App থেকে <b>Pay</b> অপশনে গিয়ে উপরের Pay ID-তে USDT Send করুন।\n` +
        `২. সমমূল্য BDT ব্যালেন্স পেতে রেট: $1 = ৳125 BDT।\n\n` +
        `ডলার পাঠানোর পর আপনি কত BDT ব্যালেন্স সমপরিমাণ পাঠিয়েছেন বা কত USD তা সংখ্যায় লিখুন:`
    );
    return;
  }

  if (data === 'rsl_gen_license') {
    await answerCb(queryId);
    await showPackageSelection(chatId);
    return;
  }

  // Real VIP License Purchase via Supabase
  if (data.startsWith('buy_vip_pkg_')) {
    const pkgId = parseInt(data.replace('buy_vip_pkg_', ''));
    const pkg = store.packages.find((p) => p.id === pkgId);
    const reseller = store.resellers.get(userId) || (userId === CONFIG.OWNER_ID ? store.resellers.get(CONFIG.OWNER_ID) : null);

    if (!pkg || !reseller) {
      await answerCb(queryId, 'প্যাকেজ বা রিসেলার পাওয়া যায়নি!', true);
      return;
    }

    if (reseller.balance < pkg.price_bdt) {
      await answerCb(queryId, '❌ অপর্যাপ্ত ব্যালেন্স!', true);
      await editTg(
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

    await answerCb(queryId, '⚡ VIP লাইসেন্স তৈরি হচ্ছে...');

    // Deduct Balance
    reseller.balance -= pkg.price_bdt;
    reseller.total_licenses += 1;

    // Supabase Insert with exact VIP tier and format
    const res = await insertSupabaseVipLicense({
      durationDays: pkg.duration_days,
      durationCode: pkg.duration_code,
      resellerCode: reseller.reseller_code,
    });

    if (!res.success) {
      // Refund on failure
      reseller.balance += pkg.price_bdt;
      reseller.total_licenses -= 1;
      await editTg(chatId, messageId, `❌ লাইসেন্স তৈরিতে সমস্যা: ${res.error}`);
      return;
    }

    const licenseKey = res.license.key;

    // Delivery message requested by user
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

    await editTg(chatId, messageId, deliveryText, {
      inline_keyboard: [
        [{ text: '🔑 আরেকটি কী তৈরি করুন', callback_data: 'rsl_gen_license' }],
        [{ text: '📜 My Licenses', callback_data: 'rsl_my_licenses' }],
      ],
    });
    return;
  }

  // Reseller Licenses from Supabase
  if (data === 'rsl_my_licenses') {
    const reseller = store.resellers.get(userId) || store.resellers.get(CONFIG.OWNER_ID);
    await answerCb(queryId);
    await showResellerLicenses(chatId, reseller);
    return;
  }

  // Device Reset
  if (data === 'rsl_device_reset') {
    const reseller = store.resellers.get(userId) || store.resellers.get(CONFIG.OWNER_ID);
    await answerCb(queryId);
    await showDeviceResetMenu(chatId, reseller);
    return;
  }

  if (data.startsWith('reset_device_key_')) {
    const key = data.replace('reset_device_key_', '');
    try {
      const { data: updated, error } = await supabase
        .from('ishak_licenses')
        .update({ device_id: null, last_used_at: null })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        await answerCb(queryId, `ত্রুটি: ${error.message}`, true);
      } else {
        await answerCb(queryId, '✅ ডিভাইস রিসেট সফল হয়েছে!', true);
        await editTg(
          chatId,
          messageId,
          `✅ <b>Device Reset Successful!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `License: <code>${key}</code>\n` +
            `পূর্ববর্তী Device Binding আনলক করা হয়েছে। ক্লায়েন্ট এখন নতুন ডিভাইসে লগইন করতে পারবেন।`
        );
      }
    } catch (e) {
      await answerCb(queryId, 'ব্যর্থ হয়েছে', true);
    }
    return;
  }

  // ================= ADMIN ACTIONS =================
  if (userId === CONFIG.OWNER_ID) {
    if (data === 'owner_home') {
      await answerCb(queryId);
      await editTg(chatId, messageId, `👑 <b>TradePilot Owner Admin Panel</b>`, getOwnerInlineKeyboard());
      return;
    }

    if (data === 'admin_add_reseller') {
      await answerCb(queryId);
      await startAddReseller(chatId, userId);
      return;
    }

    if (data === 'admin_resellers') {
      await answerCb(queryId);
      await showResellersList(chatId);
      return;
    }

    if (data === 'admin_deposits') {
      await answerCb(queryId);
      await showPendingDeposits(chatId);
      return;
    }

    if (data.startsWith('admin_approve_dep_')) {
      const depId = parseInt(data.replace('admin_approve_dep_', ''));
      const dep = store.deposits.get(depId);

      if (!dep || dep.status !== 'pending') {
        await answerCb(queryId, 'ডিপোজিট ইতিমধ্যে প্রসেস হয়েছে!', true);
        return;
      }

      dep.status = 'approved';
      const reseller = store.resellers.get(dep.telegram_id);
      if (reseller) {
        reseller.balance += dep.amount;
        reseller.total_deposited += dep.amount;
      }

      await answerCb(queryId, '✅ Deposit Approved!', true);
      await editTg(
        chatId,
        messageId,
        `✅ <b>Deposit #${depId} Approved!</b>\nপরিমাণ: ৳${dep.amount}\nরিসেলার ${dep.reseller_code}-এর নতুন ব্যালেন্স: ৳${reseller?.balance.toFixed(2)}`
      );

      // Notify Reseller
      await sendTg(
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
      const dep = store.deposits.get(depId);
      if (dep) dep.status = 'rejected';
      await answerCb(queryId, '❌ Deposit Rejected', true);
      await editTg(chatId, messageId, `❌ Deposit #${depId} বাতিল (Rejected) করা হয়েছে।`);
      return;
    }

    if (data === 'admin_licenses') {
      await answerCb(queryId);
      await showLicenseManager(chatId);
      return;
    }

    if (data === 'admin_stats') {
      await answerCb(queryId);
      await showBotStatistics(chatId);
      return;
    }

    if (data === 'admin_payment_settings') {
      await answerCb(queryId);
      await showPaymentSettings(chatId);
      return;
    }

    if (data === 'change_bkash_setting') {
      store.userStates.set(userId, { flow: 'UPDATE_BKASH' });
      await answerCb(queryId);
      await sendTg(chatId, `🔴 নতুন <b>bKash Personal নম্বর</b> লিখে পাঠান:`);
      return;
    }

    if (data === 'change_binance_setting') {
      store.userStates.set(userId, { flow: 'UPDATE_BINANCE' });
      await answerCb(queryId);
      await sendTg(chatId, `🟡 নতুন <b>Binance Pay ID</b> লিখে পাঠান:`);
      return;
    }

    if (data === 'admin_broadcast') {
      await answerCb(queryId);
      await startBroadcast(chatId, userId);
      return;
    }
  }
}

// Helper: Show Reseller Licenses from Supabase
async function showResellerLicenses(chatId, reseller) {
  try {
    const { data: licenses, error } = await supabase
      .from('ishak_licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error || !licenses || licenses.length === 0) {
      await sendTg(chatId, `📜 আপনার তৈরি করা কোনো লাইসেন্স পাওয়া যায়নি।`);
      return;
    }

    let text = `📜 <b>My TradePilot Licenses (Recent 8)</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    licenses.forEach((l, idx) => {
      text += `<b>${idx + 1}.</b> <code>${l.key}</code>\n`;
      text += `   💎 Tier: <b>${l.tier}</b> | ⏱️ ${l.duration}\n`;
      text += `   📱 Device: ${l.device_id ? '🔒 Bound' : '🟢 Unbound (Ready)'}\n`;
      text += `   🛡️ Status: ${l.active ? 'Active' : 'Blocked'}\n\n`;
    });

    await sendTg(chatId, text, {
      inline_keyboard: [[{ text: '🔄 Device Reset', callback_data: 'rsl_device_reset' }]],
    });
  } catch (e) {
    await sendTg(chatId, `ত্রুটি: লাইসেন্স লোড করা সম্ভব হয়নি।`);
  }
}

// Helper: Show Device Reset Menu
async function showDeviceResetMenu(chatId, reseller) {
  try {
    const { data: boundLicenses } = await supabase
      .from('ishak_licenses')
      .select('*')
      .not('device_id', 'is', null)
      .limit(6);

    if (!boundLicenses || boundLicenses.length === 0) {
      await sendTg(chatId, `ℹ️ এই মুহূর্তে কোনো লাইসেন্সে ডিভাইস বাইন্ড নেই। ক্লায়েন্ট ট্রেডিং বটে লগইন করলে ডিভাইস লক হয়।`);
      return;
    }

    const buttons = boundLicenses.map((l) => [
      { text: `🔄 Reset: ${l.key.slice(0, 16)}...`, callback_data: `reset_device_key_${l.key}` },
    ]);

    await sendTg(
      chatId,
      `🔄 <b>Device Reset (HWID Unbind)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `ক্লায়েন্টের ডিভাইস পরিবর্তন বা সমস্যার ক্ষেত্রে ডিভাইস আনবাইন্ড করতে লাইসেন্স নির্বাচন করুন:`,
      { inline_keyboard: buttons }
    );
  } catch (e) {
    await sendTg(chatId, `ত্রুটি: ডিভাইস রিসেট তালিকা লোড করা যায়নি।`);
  }
}

// Helper: Manual Add Reseller
async function startAddReseller(chatId, userId) {
  store.userStates.set(userId, { flow: 'ADD_RESELLER', step: 'ASK_TARGET' });
  await sendTg(
    chatId,
    `➕ <b>Manual Reseller Addition</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `নতুন রিসেলারের <b>Telegram Chat ID</b> অথবা <b>Username</b> (@ সহ বা ছাড়া) লিখে পাঠান:\n\n` +
      `<i>(উদাহরণ: 8274806813 অথবা @IshakVhai)</i>`
  );
}

// Helper: List Resellers for Admin
async function showResellersList(chatId) {
  const resellers = Array.from(store.resellers.values());
  let text = `👥 <b>Active Resellers List (${resellers.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

  resellers.forEach((r) => {
    text += `• <b>${r.reseller_code}</b> | TG: <code>${r.telegram_id}</code>\n`;
    text += `  💰 Balance: <b>৳${r.balance.toFixed(2)}</b> | Total Generated: ${r.total_licenses}\n\n`;
  });

  await sendTg(chatId, text, {
    inline_keyboard: [
      [{ text: '➕ Add Reseller', callback_data: 'admin_add_reseller' }],
      [{ text: '🔙 Owner Menu', callback_data: 'owner_home' }],
    ],
  });
}

// Helper: Show Pending Deposits
async function showPendingDeposits(chatId) {
  const pending = Array.from(store.deposits.values()).filter((d) => d.status === 'pending');
  let text = `💰 <b>Pending Deposits (${pending.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  const buttons = [];

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

  await sendTg(chatId, text, { inline_keyboard: buttons });
}

// Helper: License Manager for Admin
async function showLicenseManager(chatId) {
  const { count } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true });
  await sendTg(
    chatId,
    `🔑 <b>Supabase License Manager</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `মোট লাইসেন্স সংখ্যা: <b>${count || 0}</b> টি\n` +
      `টেবিল: <code>ishak_licenses</code>\n` +
      `URL: <code>${CONFIG.SUPABASE_URL}</code>\n\n` +
      `রিসেলারদের সকল তৈরি করা লাইসেন্স সরাসরি Supabase ক্লাউডে সিঙ্ক হচ্ছে।`,
    {
      inline_keyboard: [[{ text: '🔙 Owner Menu', callback_data: 'owner_home' }]],
    }
  );
}

// Helper: Bot Statistics
async function showBotStatistics(chatId) {
  const { count: totalLicenses } = await supabase.from('ishak_licenses').select('*', { count: 'exact', head: true });
  const activeResellers = store.resellers.size;
  const totalVolume = Array.from(store.deposits.values())
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  await sendTg(
    chatId,
    `📊 <b>TradePilot Bot Statistics</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 <b>Total Users Interacted:</b> ${store.users.size}\n` +
      `💼 <b>Active Resellers:</b> ${activeResellers}\n` +
      `💰 <b>Total Deposit Volume:</b> ৳${totalVolume.toFixed(2)}\n` +
      `🔑 <b>Supabase Total Licenses:</b> ${totalLicenses || 0} টি\n` +
      `🕒 <b>Bot Uptime:</b> ${Math.floor(process.uptime() / 60)} Minutes`,
    {
      inline_keyboard: [[{ text: '🔙 Owner Menu', callback_data: 'owner_home' }]],
    }
  );
}

// Helper: Payment Settings
async function showPaymentSettings(chatId) {
  await sendTg(
    chatId,
    `⚙️ <b>Payment Gateways Configuration</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 <b>bKash Personal:</b> <code>${store.paymentSettings.bkash}</code>\n` +
      `🟡 <b>Binance Pay ID:</b> <code>${store.paymentSettings.binancePayId}</code>\n\n` +
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

// Helper: Broadcast Start
async function startBroadcast(chatId, userId) {
  store.userStates.set(userId, { flow: 'BROADCAST' });
  await sendTg(
    chatId,
    `📢 <b>Broadcast Announcement</b>\n` +
      `বটের সকল ব্যবহারকারীদের কাছে যে বার্তা পাঠাতে চান তা লিখে পাঠিয়ে দিন:`
  );
}

// 13. Long-Polling Engine
let isPolling = true;
let updateOffset = 0;

async function startPolling() {
  console.log('🚀 TradePilot Telegram Bot Polling Engine Started...');

  // Set Commands in BotFather menu
  await tgRequest('setMyCommands', {
    commands: [
      { command: 'start', description: 'বট মেনু ও ড্যাশবোর্ড' },
      { command: 'menu', description: 'মেইন মেনু' },
      { command: 'help', description: 'সহায়তা ও সাপোর্ট' },
    ],
  });

  // Main polling loop
  while (isPolling) {
    try {
      const res = await tgRequest('getUpdates', {
        offset: updateOffset + 1,
        timeout: 20,
        allowed_updates: ['message', 'callback_query'],
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          updateOffset = update.update_id;
          if (update.message) {
            handleMessage(update.message).catch((e) => console.error('Message error:', e.message));
          } else if (update.callback_query) {
            handleCallback(update.callback_query).catch((e) => console.error('Callback error:', e.message));
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.warn('Polling loop retry in 5s:', err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// 14. Server Boot
app.listen(CONFIG.PORT, () => {
  console.log(`🌐 TradePilot Server listening on port ${CONFIG.PORT}`);
  startPolling();
});

export { app, store, CONFIG };
