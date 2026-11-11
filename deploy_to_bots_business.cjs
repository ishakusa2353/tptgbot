/**
 * ==============================================================================
 * BOTS.BUSINESS DEPLOYER SCRIPT FOR TRADEPILOT RESELLER BOT (BOT ID: 3009407)
 * Injects all commands, BJS code, keyboards, and Supabase integrations
 * ==============================================================================
 */

const https = require('https');

const API_KEY = 'AOU7VJYGmp26FZMlGej3nyKEzXCxpkSc_MQ3g5yV';
const BOT_ID = 3009407;
const BASE_URL = 'https://api.bots.business/v1';

const SUPABASE_URL = 'https://qbazzarqiplrqqfytajz.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo';
const BOT_TOKEN = '9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ';
const OWNER_ID = 8274806813;

function apiRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.append('api_key', API_KEY);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// -------------------------------------------------------------
// COMMAND DEFINITIONS FOR BOTS.BUSINESS
// -------------------------------------------------------------

const commands = [
  // 1. /start
  {
    command: '/start',
    aliases: ['Start', 'start', '/menu', 'Menu'],
    need_reply: false,
    code: `
let ownerId = 8274806813;

if (user.telegramid != ownerId) {
  HTTP.get({
    url: "https://api.telegram.org/bot9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ/getChatMember?chat_id=@trade_pilotbot&user_id=" + user.telegramid,
    success: "/on_check_channel_start"
  });
  return;
}

Bot.runCommand("/show_menu");
`,
  },

  // 2. /on_check_channel_start
  {
    command: '/on_check_channel_start',
    need_reply: false,
    code: `
let isMember = false;
try {
  let res = JSON.parse(content);
  if (res.ok && res.result) {
    let s = res.result.status;
    isMember = ["creator", "administrator", "member", "restricted"].indexOf(s) >= 0;
  }
} catch (e) {}

if (!isMember) {
  let text = 
    "👋 <b>স্বাগতম TradePilot Reseller Bot-এ!</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n\\n" +
    "বটটি ব্যবহারের জন্য আপনাকে প্রথমে আমাদের অফিসিয়াল চ্যানেল <b>@trade_pilotbot</b>-এ জয়েন হতে হবে।\\n\\n" +
    "নিচের বাটনে ক্লিক করে জয়েন করার পর <b>\\"✅ Verify Membership / যাচাই করুন\\"</b> বাটনে চাপুন:";

  let buttons = [
    [{ text: "📢 Join Official Channel", url: "https://t.me/trade_pilotbot" }],
    [{ text: "✅ Verify Membership / যাচাই করুন", callback_data: "/verify_channel" }]
  ];

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
  return;
}

Bot.runCommand("/show_menu");
`,
  },

  // 3. /verify_channel
  {
    command: '/verify_channel',
    need_reply: false,
    code: `
HTTP.get({
  url: "https://api.telegram.org/bot9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ/getChatMember?chat_id=@trade_pilotbot&user_id=" + user.telegramid,
  success: "/on_check_channel_callback"
});
`,
  },

  // 4. /on_check_channel_callback
  {
    command: '/on_check_channel_callback',
    need_reply: false,
    code: `
let isMember = false;
try {
  let res = JSON.parse(content);
  if (res.ok && res.result) {
    let s = res.result.status;
    isMember = ["creator", "administrator", "member", "restricted"].indexOf(s) >= 0;
  }
} catch (e) {}

if (isMember) {
  Bot.sendMessage("✅ চ্যানেল ভেরিফিকেশন সফল হয়েছে!");
  Bot.runCommand("/show_menu");
} else {
  Bot.sendMessage("❌ আপনি এখনও চ্যানেলে জয়েন হননি! অনুগ্রহ করে @trade_pilotbot চ্যানেলে জয়েন হয়ে পুনরায় চেষ্টা করুন।");
}
`,
  },

  // 5. /show_menu
  {
    command: '/show_menu',
    need_reply: false,
    code: `
let ownerId = 8274806813;

let ownerKeyboard = {
  keyboard: [
    [{ text: "👑 Owner Admin Panel" }, { text: "👥 Manage Resellers" }],
    [{ text: "➕ Add Reseller" }, { text: "➖ Remove Reseller" }],
    [{ text: "💰 Deposit Requests" }, { text: "🔑 License Manager" }],
    [{ text: "📊 Bot Statistics" }, { text: "⚙️ Payment Settings" }],
    [{ text: "📢 Broadcast" }, { text: "💬 Support" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

if (user.telegramid == ownerId) {
  let text = 
    "👑 <b>স্বাগতম OWNER ADMIN PANEL-এ!</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
    "🛡️ <b>TradePilot Reseller Management System</b>\\n" +
    "👤 <b>Owner ID:</b> <code>" + ownerId + "</code>\\n" +
    "📡 <b>Official Channel:</b> @trade_pilotbot\\n" +
    "💾 <b>Cloud Database:</b> Supabase Connected\\n\\n" +
    "নিচের কিবোর্ড থেকে অপশন নির্বাচন করুন:";

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: ownerKeyboard });
  return;
}

// Check Reseller in Supabase
HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + user.telegramid + "&select=*",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_check_reseller_menu"
});
`,
  },

  // 6. /on_check_reseller_menu
  {
    command: '/on_check_reseller_menu',
    need_reply: false,
    code: `
let resellerKeyboard = {
  keyboard: [
    [{ text: "🔑 Generate VIP License" }, { text: "💳 My Balance" }],
    [{ text: "📜 My Licenses" }, { text: "💵 Deposit Request" }],
    [{ text: "🔄 Device Reset" }, { text: "💬 Support" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

let rows = [];
try {
  rows = JSON.parse(content);
} catch (e) {}

if (rows && rows.length > 0 && rows[0].data && rows[0].data.status === "active") {
  let r = rows[0].data;
  User.setProperty("reseller_code", r.reseller_code, "string");
  User.setProperty("balance", r.balance, "float");

  let text = 
    "💼 <b>Welcome to TradePilot Reseller Dashboard!</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
    "🏷️ <b>Reseller Code:</b> <code>" + r.reseller_code + "</code>\\n" +
    "💰 <b>Available Balance:</b> <b>৳" + (r.balance || 0).toFixed(2) + " BDT</b>\\n" +
    "🔑 <b>Generated Licenses:</b> " + (r.total_licenses || 0) + "\\n" +
    "🛡️ <b>Status:</b> 🟢 Active Authorized Reseller\\n\\n" +
    "নিচের কিবোর্ড মেনু ব্যবহার করে কার্যক্রম পরিচালনা করুন:";

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: resellerKeyboard });
  return;
}

// Access Denied for Guests
let deniedText = 
  "⛔ <b>Access Denied!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n\\n" +
  "আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\\n" +
  "রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য আপনার উপরের <b>Chat ID</b> টি এডমিনকে জানিয়ে যোগাযোগ করুন।";

let buttons = [
  [{ text: "📩 Contact Admin / রিসেলার আবেদন", url: "https://t.me/IshakVhai" }]
];

Api.sendMessage({ text: deniedText, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 7. 🔑 Generate VIP License
  {
    command: '🔑 Generate VIP License',
    aliases: ['/generate_vip', 'Generate VIP License'],
    need_reply: false,
    code: `
let buttons = [
  [{ text: "💎 Starter Plan (20 Days) - ৳500 ($4)", callback_data: "/buy_pkg 20 20d 500" }],
  [{ text: "💎 Standard Plan (30 Days) - ৳750 ($6)", callback_data: "/buy_pkg 30 30d 750" }],
  [{ text: "💎 Pro Plan (45 Days) - ৳1000 ($8)", callback_data: "/buy_pkg 45 45d 1000" }],
  [{ text: "💎 Elite Plan (60 Days) - ৳1750 ($14)", callback_data: "/buy_pkg 60 60d 1750" }]
];

let text = 
  "🔑 <b>Select VIP License Duration</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "প্যাকেজ মূল্য আপনার ব্যালেন্স থেকে কর্তন হবে এবং সাথে সাথে Supabase-এ <b>VIP Tier</b> কী তৈরি হবে:";

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 8. /buy_pkg
  {
    command: '/buy_pkg',
    need_reply: false,
    code: `
let parts = (params || "").split(" ");
let days = parseInt(parts[0]) || 30;
let code = parts[1] || "30d";
let price = parseFloat(parts[2]) || 750;

User.setProperty("buying_days", days, "integer");
User.setProperty("buying_code", code, "string");
User.setProperty("buying_price", price, "float");

// Fetch fresh reseller balance from Supabase
let ownerId = 8274806813;
let queryId = (user.telegramid == ownerId) ? "reseller:8274806813" : ("reseller:" + user.telegramid);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq." + queryId + "&select=*",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_verify_balance_buy"
});
`,
  },

  // 9. /on_verify_balance_buy
  {
    command: '/on_verify_balance_buy',
    need_reply: false,
    code: `
let days = User.getProperty("buying_days", 30);
let code = User.getProperty("buying_code", "30d");
let price = User.getProperty("buying_price", 750);

let rows = [];
try { rows = JSON.parse(content); } catch (e) {}

let rData = (rows && rows.length > 0 && rows[0].data) ? rows[0].data : null;
let currentBalance = rData ? (rData.balance || 0) : 0;
let rCode = rData ? (rData.reseller_code || ("TP-RSL-" + user.telegramid)) : ("TP-RSL-" + user.telegramid);

if (user.telegramid != 8274806813 && currentBalance < price) {
  Api.sendMessage({
    text: "❌ <b>Insufficient Balance!</b>\\n━━━━━━━━━━━━━━━━━━━━━\\nপ্যাকেজ মূল্য: <b>৳" + price + "</b>\\nআপনার বর্তমান ব্যালেন্স: <b>৳" + currentBalance.toFixed(2) + "</b>\\n\\nঅনুগ্রহ করে প্রথমে ব্যালেন্স ডিপোজিট করুন।",
    parse_mode: "HTML"
  });
  return;
}

// Generate Key format TP-VIP-XXXX-XXXX-XXXX-XXXX
let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function seg(len) {
  let s = "";
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}
let key = "TP-VIP-" + seg(4) + "-" + seg(4) + "-" + seg(4) + "-" + seg(4);

User.setProperty("last_generated_key", key, "string");
User.setProperty("new_balance", (currentBalance - price), "float");
User.setProperty("reseller_code", rCode, "string");

// Insert into Supabase ishak_licenses
let now = Date.now();
let durationMs = days * 86400 * 1000;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
  },
  body: {
    key: key,
    active: true,
    tier: "VIP",
    duration: code,
    duration_ms: durationMs,
    exp: null,
    first_login_at: null,
    device_id: null,
    trader_id: "",
    created_at: now,
    last_used_at: null,
    note: "[DEV_LIMIT:1] Reseller: " + rCode
  },
  success: "/on_license_inserted_success"
});
`,
  },

  // 10. /on_license_inserted_success
  {
    command: '/on_license_inserted_success',
    need_reply: false,
    code: `
let key = User.getProperty("last_generated_key");
let days = User.getProperty("buying_days", 30);
let rCode = User.getProperty("reseller_code", "TP-RSL-VIP");
let newBal = User.getProperty("new_balance", 0);

// Update Balance in ishak_bot_data
let updateUrl = "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + user.telegramid;
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  },
  body: {
    id: "reseller:" + user.telegramid,
    type: "reseller",
    telegram_id: user.telegramid,
    data: {
      id: user.telegramid,
      telegram_id: user.telegramid,
      username: (user.username || ""),
      reseller_code: rCode,
      balance: newBal,
      status: "active"
    },
    updated_at: Date.now()
  }
});

let deliveryContent = 
"⚡ TRADEPILOT - LICENSE DELIVERY ⚡\\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
"Congratulations! Your TradePilot Trading Bot License is ready.\\n\\n" +
"🔑 License Key: " + key + "\\n" +
"💎 Membership Tier: VIP\\n" +
"⏱️ Time Limit: " + days + " Days\\n" +
"⌛ Expiry Status: Countdown starts upon first login in the bot\\n" +
"📱 Device Limit: 1 Device\\n" +
"👤 Reseller: " + rCode + "\\n\\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
"📌 How to Activate & Trade in Quotex:\\n" +
"1. Open Quotex in Browser.\\n" +
"2. Launch the TradePilot Trading Bot widget on your chart.\\n" +
"3. Click the Bot Logo / VIP Key button.\\n" +
"4. Enter your VIP License Key and click \\"Verify & Unlock\\".\\n" +
"5. Choose your desired Timeframe to start receiving 1-trade auto signals!\\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

let fullMessage = 
  "🎉 <b>VIP License Generated Successfully! [100%]</b>\\n" +
  "<i>(নিচের বক্সে একবার ট্যাপ করলেই পুরো ডেলিভারি মেসেজ কপি হবে)</i>\\n\\n" +
  "<pre>" + deliveryContent + "</pre>\\n\\n" +
  "💰 <b>Available Balance:</b> ৳" + newBal.toFixed(2) + " BDT";

let buttons = [
  [{ text: "📜 View In My Licenses", callback_data: "/my_licenses" }]
];

Api.sendMessage({ text: fullMessage, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 11. 💳 My Balance
  {
    command: '💳 My Balance',
    aliases: ['/my_balance', 'My Balance'],
    need_reply: false,
    code: `
let ownerId = 8274806813;
let queryId = (user.telegramid == ownerId) ? "reseller:8274806813" : ("reseller:" + user.telegramid);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq." + queryId + "&select=*",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_my_balance"
});
`,
  },

  // 12. /on_show_my_balance
  {
    command: '/on_show_my_balance',
    need_reply: false,
    code: `
let rows = [];
try { rows = JSON.parse(content); } catch (e) {}

let r = (rows && rows.length > 0 && rows[0].data) ? rows[0].data : {
  reseller_code: (user.telegramid == 8274806813 ? "TP-RSL-OWNER" : ("TP-RSL-" + user.telegramid)),
  balance: (user.telegramid == 8274806813 ? 100000 : 0),
  total_deposited: 0,
  total_licenses: 0
};

let text = 
  "💳 <b>My Balance Information</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + r.reseller_code + "</code>\\n" +
  "💰 <b>Available Balance:</b> <b>৳" + (r.balance || 0).toFixed(2) + " BDT</b> (≈ $" + ((r.balance || 0) / 125).toFixed(2) + " USD)\\n" +
  "📥 <b>Total Deposited:</b> ৳" + (r.total_deposited || 0).toFixed(2) + "\\n" +
  "🔑 <b>Generated Licenses:</b> " + (r.total_licenses || 0) + "\\n" +
  "🛡️ <b>Database Sync:</b> 🟢 Supabase Cloud (<code>ishak_bot_data</code>)\\n\\n" +
  "ব্যালেন্স রিচার্জ করতে নিচের <b>\\"💵 Deposit Request\\"</b> বাটন ব্যবহার করুন।";

Api.sendMessage({ text: text, parse_mode: "HTML" });
`,
  },

  // 13. 📜 My Licenses
  {
    command: '📜 My Licenses',
    aliases: ['/my_licenses', 'My Licenses'],
    need_reply: false,
    code: `
let ownerId = 8274806813;
let url = "";

if (user.telegramid == ownerId) {
  url = "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?tier=neq.SYSTEM&order=created_at.desc&limit=8&select=*";
} else {
  let rCode = User.getProperty("reseller_code", "TP-RSL-" + user.telegramid);
  url = "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?note=like.*" + rCode + "*&order=created_at.desc&limit=8&select=*";
}

HTTP.get({
  url: url,
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_licenses_list"
});
`,
  },

  // 14. /on_show_licenses_list
  {
    command: '/on_show_licenses_list',
    need_reply: false,
    code: `
let licenses = [];
try { licenses = JSON.parse(content); } catch (e) {}

if (!licenses || licenses.length === 0) {
  let emptyText = 
    "📜 <b>My Licenses (0)</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "বর্তমানে কোনো লাইসেন্স পাওয়া যায়নি।\\n" +
    "নতুন VIP লাইসেন্স তৈরি করতে নিচের <b>\\"🔑 Generate VIP License\\"</b> বাটন চাপুন।";
  Api.sendMessage({ text: emptyText, parse_mode: "HTML" });
  return;
}

let isOwner = (user.telegramid == 8274806813);
let text = "📜 <b>" + (isOwner ? "Master License Control Panel" : "My TradePilot Licenses") + " (" + licenses.length + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n\\n";
let buttons = [];

for (let i = 0; i < licenses.length; i++) {
  let l = licenses[i];
  let isBlocked = (l.active === false);
  let statusIcon = isBlocked ? "🔴 Blocked" : "🟢 Active";
  let shortKey = (l.key.length > 20) ? (l.key.slice(0, 14) + "...") : l.key;

  text += "<b>" + (i + 1) + ".</b> <code>" + l.key + "</code>\\n";
  text += "   💎 Tier: <b>" + l.tier + "</b> | ⏱️ <b>" + l.duration + "</b>\\n";
  text += "   📱 Device: " + (l.device_id ? "🔒 Bound (HWID)" : "🟢 Unbound") + "\\n";
  text += "   🛡️ Status: " + statusIcon + "\\n\\n";

  if (isBlocked) {
    buttons.push([
      { text: "🟢 Unblock (" + shortKey + ")", callback_data: "/unblock_lic " + l.key },
      { text: "🗑️ Delete", callback_data: "/del_prompt " + l.key }
    ]);
  } else {
    buttons.push([
      { text: "🚫 Block (" + shortKey + ")", callback_data: "/block_lic " + l.key },
      { text: "🗑️ Delete", callback_data: "/del_prompt " + l.key }
    ]);
  }
}

buttons.push([
  { text: "🔍 Search License Key", callback_data: "/search_lic_prompt" },
  { text: "🔄 Refresh List", callback_data: "/my_licenses" }
]);

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 15. /block_lic
  {
    command: '/block_lic',
    need_reply: false,
    code: `
let key = (params || "").trim();
if (!key) return;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key,
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "X-HTTP-Method-Override": "PATCH"
  },
  body: {
    active: false
  },
  success: "/on_block_done"
});
`,
  },

  // 16. /on_block_done
  {
    command: '/on_block_done',
    need_reply: false,
    code: `
Bot.sendMessage("🚫 <b>License Blocked Successfully!</b>\\nলাইসেন্সটি সফলভাবে ব্লক করা হয়েছে এবং ক্লায়েন্ট লগইন নিষ্ক্রিয় করা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,
  },

  // 17. /unblock_lic
  {
    command: '/unblock_lic',
    need_reply: false,
    code: `
let key = (params || "").trim();
if (!key) return;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key,
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "X-HTTP-Method-Override": "PATCH"
  },
  body: {
    active: true
  },
  success: "/on_unblock_done"
});
`,
  },

  // 18. /on_unblock_done
  {
    command: '/on_unblock_done',
    need_reply: false,
    code: `
Bot.sendMessage("🟢 <b>License Unblocked Successfully!</b>\\nলাইসেন্সটি পুনরায় একটিভ করা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,
  },

  // 19. /del_prompt
  {
    command: '/del_prompt',
    need_reply: false,
    code: `
let key = (params || "").trim();
let buttons = [
  [{ text: "🗑️ হ্যাঁ, চিরতরে ডিলিট করুন", callback_data: "/del_confirm " + key }],
  [{ text: "❌ বাতিল", callback_data: "/my_licenses" }]
];

let text = 
  "⚠️ <b>Delete Confirmation!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনি কি নিশ্চিতভাবে এই লাইসেন্সটি ডাটাবেজ থেকে চিরতরে ডিলিট করতে চান?\\n\\n" +
  "🔑 <b>Key:</b> <code>" + key + "</code>\\n" +
  "<i>ডিলিট করলে ক্লায়েন্ট আর এই কী দিয়ে লগইন করতে পারবে না।</i>";

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 20. /del_confirm
  {
    command: '/del_confirm',
    need_reply: false,
    code: `
let key = (params || "").trim();
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key,
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  },
  success: "/on_del_done"
});
`,
  },

  // 21. /on_del_done
  {
    command: '/on_del_done',
    need_reply: false,
    code: `
Bot.sendMessage("🗑️ <b>License Deleted!</b>\\nলাইসেন্সটি ডাটাবেজ থেকে সফলভাবে মুছে ফেলা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,
  },

  // 22. 💵 Deposit Request
  {
    command: '💵 Deposit Request',
    aliases: ['/deposit', 'Deposit Request'],
    need_reply: false,
    code: `
let bkash = Bot.getProperty("bkash_num", "01606398924");
let binance = Bot.getProperty("binance_id", "827480681");

let text = 
  "💵 <b>Deposit Payment Method</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "ব্যালেন্স রিচার্জের জন্য পেমেন্ট মাধ্যম নির্বাচন করুন:\\n\\n" +
  "🔴 <b>bKash Personal:</b> <code>" + bkash + "</code>\\n" +
  "🟡 <b>Binance Pay / USDT:</b> <code>" + binance + "</code>\\n\\n" +
  "পেমেন্ট সম্পন্ন করার পর নিচের বাটন চেপে TrxID সাবমিট করুন:";

let buttons = [
  [{ text: "🔴 bKash Personal", callback_data: "/dep_step_amt bkash" }],
  [{ text: "🟡 Binance Pay / USDT", callback_data: "/dep_step_amt binance" }]
];

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 23. /dep_step_amt
  {
    command: '/dep_step_amt',
    need_reply: false,
    code: `
let method = (params || "bkash").trim();
User.setProperty("dep_method", method, "string");

Bot.runCommand("/on_dep_amt_input");
Bot.sendMessage("💰 <b>আপনি কত টাকা রিচার্জ করতে চান তা সংখ্যায় লিখে পাঠান:</b>\\n<i>(যেমন: 500 বা 1000)</i>", { parse_mode: "HTML" });
`,
  },

  // 24. /on_dep_amt_input
  {
    command: '/on_dep_amt_input',
    need_reply: true,
    code: `
let amt = parseFloat(message);
if (isNaN(amt) || amt < 10) {
  Bot.sendMessage("⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500 বা 1000):");
  Bot.runCommand("/on_dep_amt_input");
  return;
}

User.setProperty("dep_amount", amt, "float");
Bot.runCommand("/on_dep_trx_input");
Bot.sendMessage("📝 <b>Transaction ID (TrxID) / Payment ID লিখে পাঠান:</b>", { parse_mode: "HTML" });
`,
  },

  // 25. /on_dep_trx_input
  {
    command: '/on_dep_trx_input',
    need_reply: true,
    code: `
let trx = (message || "").trim().toUpperCase();
if (trx.length < 5) {
  Bot.sendMessage("⚠️ সঠিক Transaction ID দিন (কমপক্ষে ৫ অক্ষর):");
  Bot.runCommand("/on_dep_trx_input");
  return;
}

User.setProperty("dep_trx", trx, "string");
Bot.runCommand("/on_dep_sender_input");
Bot.sendMessage("📱 <b>Sender Number / Binance Pay ID লিখে পাঠান:</b>", { parse_mode: "HTML" });
`,
  },

  // 26. /on_dep_sender_input
  {
    command: '/on_dep_sender_input',
    need_reply: true,
    code: `
let sender = (message || "").trim();
let method = User.getProperty("dep_method", "bKash Personal");
let amt = User.getProperty("dep_amount", 500);
let trx = User.getProperty("dep_trx", "TRX12345");
let depId = Math.floor(100 + Math.random() * 900);
let rCode = User.getProperty("reseller_code", "TP-RSL-" + user.telegramid);

// Save to Supabase ishak_bot_data
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  },
  body: {
    id: "deposit:" + depId,
    type: "deposit",
    telegram_id: user.telegramid,
    data: {
      id: depId,
      telegram_id: user.telegramid,
      reseller_code: rCode,
      method: (method == "binance" ? "Binance Pay / USDT" : "bKash Personal"),
      amount: amt,
      transaction_id: trx,
      sender: sender,
      status: "pending"
    },
    updated_at: Date.now()
  }
});

let userText = 
  "✅ <b>Deposit Request Submitted Successfully!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Deposit ID:</b> #" + depId + "\\n" +
  "💳 <b>Method:</b> " + method + "\\n" +
  "💰 <b>Amount:</b> ৳" + amt.toFixed(2) + "\\n" +
  "🔢 <b>TrxID:</b> <code>" + trx + "</code>\\n" +
  "📱 <b>Sender:</b> " + sender + "\\n" +
  "⏳ <b>Status:</b> 🟡 Pending Admin Verification";

Api.sendMessage({ text: userText, parse_mode: "HTML" });

// Notify Admin 8274806813
let adminText = 
  "💰 <b>নতুন DEPOSIT রিকোয়েস্ট এসেছে!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>ID:</b> #" + depId + "\\n" +
  "👤 <b>Reseller:</b> <code>" + rCode + "</code> (TG: " + user.telegramid + ")\\n" +
  "💳 <b>Method:</b> " + method + "\\n" +
  "💵 <b>Amount:</b> <b>৳" + amt.toFixed(2) + "</b>\\n" +
  "🔢 <b>TrxID:</b> <code>" + trx + "</code>\\n" +
  "📱 <b>Sender:</b> <code>" + sender + "</code>\\n\\n" +
  "অ্যাকশন বেছে নিন:";

let adminButtons = [
  [
    { text: "✅ Approve (+৳" + amt + ")", callback_data: "/approve_dep " + depId + " " + user.telegramid + " " + amt },
    { text: "❌ Reject", callback_data: "/reject_dep " + depId + " " + user.telegramid + " " + amt + " " + trx }
  ]
];

Api.sendMessage({ chat_id: 8274806813, text: adminText, parse_mode: "HTML", reply_markup: { inline_keyboard: adminButtons } });
`,
  },

  // 27. /approve_dep (Admin)
  {
    command: '/approve_dep',
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let depId = parts[0];
let targetTgId = parseInt(parts[1]);
let amt = parseFloat(parts[2]) || 0;

User.setProperty("target_dep_id", depId, "string");
User.setProperty("target_dep_user", targetTgId, "integer");
User.setProperty("target_dep_amt", amt, "float");

// Fetch current balance of target user
HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + targetTgId + "&select=*",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_approve_dep_save"
});
`,
  },

  // 28. /on_approve_dep_save
  {
    command: '/on_approve_dep_save',
    need_reply: false,
    code: `
let depId = User.getProperty("target_dep_id");
let targetTgId = User.getProperty("target_dep_user");
let amt = User.getProperty("target_dep_amt", 0);

let rows = [];
try { rows = JSON.parse(content); } catch (e) {}
let r = (rows && rows.length > 0 && rows[0].data) ? rows[0].data : {
  id: targetTgId,
  telegram_id: targetTgId,
  reseller_code: "TP-RSL-" + targetTgId,
  balance: 0,
  total_deposited: 0,
  status: "active"
};

let newBal = (r.balance || 0) + amt;
let newTot = (r.total_deposited || 0) + amt;
r.balance = newBal;
r.total_deposited = newTot;

// Update Reseller in Supabase
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  },
  body: {
    id: "reseller:" + targetTgId,
    type: "reseller",
    telegram_id: targetTgId,
    data: r,
    updated_at: Date.now()
  }
});

Bot.sendMessage("✅ <b>Deposit #" + depId + " Approved!</b>\\nরিসেলার ব্যালেন্স আপডেট হয়েছে: <b>৳" + newBal.toFixed(2) + "</b>", { parse_mode: "HTML" });

// Send notification to Reseller
let notifyText = 
  "🎉 <b>Deposit Approved!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনার <b>৳" + amt.toFixed(2) + "</b> ডিপোজিট সফলভাবে অনুমোদিত হয়েছে।\\n" +
  "বর্তমান ব্যালেন্স: <b>৳" + newBal.toFixed(2) + "</b>\\n\\n" +
  "এখন আপনি VIP লাইসেন্স তৈরি করতে পারবেন।";

Api.sendMessage({ chat_id: targetTgId, text: notifyText, parse_mode: "HTML" });
`,
  },

  // 29. /reject_dep (Admin) - SENDS IMMEDIATE NOTIFICATION TO RESELLER!
  {
    command: '/reject_dep',
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let depId = parts[0];
let targetTgId = parseInt(parts[1]);
let amt = parseFloat(parts[2]) || 0;
let trx = parts[3] || "N/A";

// Send Immediate Rejection Notification to Reseller
let rejectMsg = 
  "❌ <b>Deposit Request Rejected!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "দুঃখিত, আপনার ডিপোজিট রিকোয়েস্টটি এডমিন কর্তৃক বাতিল (Rejected) করা হয়েছে।\\n\\n" +
  "🆔 <b>Deposit ID:</b> #" + depId + "\\n" +
  "💰 <b>Amount:</b> ৳" + amt.toFixed(2) + " BDT\\n" +
  "🔢 <b>TrxID:</b> <code>" + trx + "</code>\\n\\n" +
  "⚠️ কোনো তথ্য ভুল থাকলে বা বিস্তারিত জানতে সরাসরি এডমিনের সাথে যোগাযোগ করুন:";

let buttons = [
  [{ text: "💬 Contact Admin (@IshakVhai)", url: "https://t.me/IshakVhai" }],
  [{ text: "💵 Submit New Deposit", callback_data: "/deposit" }]
];

Api.sendMessage({ chat_id: targetTgId, text: rejectMsg, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });

Bot.sendMessage("❌ <b>Deposit #" + depId + " Rejected!</b>\\nরিসেলারকে তাৎক্ষণিক রিজেকশন নোটিফিকেশন পাঠানো হয়েছে।", { parse_mode: "HTML" });
`,
  },

  // 30. 👑 Owner Admin Panel
  {
    command: '👑 Owner Admin Panel',
    aliases: ['/admin_panel', 'Owner Admin Panel'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

let text = 
  "👑 <b>TradePilot Owner Admin Panel</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
  "Owner ID: <code>8274806813</code>\\n" +
  "Platform: <b>Bots.Business 24/7 Cloud</b>\\n" +
  "Database: <b>Supabase</b> (<code>ishak_bot_data</code> & <code>ishak_licenses</code>)\\n\\n" +
  "যেকোনো অপশন পরিচালনা করতে নিচের কিবোর্ড বাটন ব্যবহার করুন।";

Api.sendMessage({ text: text, parse_mode: "HTML" });
`,
  },

  // 31. ➕ Add Reseller (Admin)
  {
    command: '➕ Add Reseller',
    aliases: ['/add_reseller', 'Add Reseller'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

Bot.runCommand("/on_add_rsl_target");
Bot.sendMessage("➕ <b>নতুন রিসেলারের Telegram Chat ID অথবা Username লিখে পাঠান:</b>\\n<i>(উদাহরণ: 8274806813 অথবা @IshakVhai)</i>", { parse_mode: "HTML" });
`,
  },

  // 32. /on_add_rsl_target
  {
    command: '/on_add_rsl_target',
    need_reply: true,
    code: `
if (user.telegramid != 8274806813) return;

let cleanTarget = (message || "").replace("@", "").trim();
let targetId = parseInt(cleanTarget) || Math.floor(100000000 + Math.random() * 900000000);

User.setProperty("target_rsl_id", targetId, "integer");
User.setProperty("target_rsl_user", cleanTarget, "string");

Bot.runCommand("/on_add_rsl_bal");
Bot.sendMessage("💰 <b>নতুন রিসেলারের একাউন্টে প্রাথমিক ব্যালেন্স কত যোগ করতে চান?</b>\\n<i>(BDT সংখ্যায় লিখুন, যেমন: 1000 বা 5000)</i>", { parse_mode: "HTML" });
`,
  },

  // 33. /on_add_rsl_bal
  {
    command: '/on_add_rsl_bal',
    need_reply: true,
    code: `
if (user.telegramid != 8274806813) return;

let bal = parseFloat(message) || 0;
let targetId = User.getProperty("target_rsl_id");
let targetUsername = User.getProperty("target_rsl_user");
let rCode = "TP-RSL-" + Math.floor(1000 + Math.random() * 9000);

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  },
  body: {
    id: "reseller:" + targetId,
    type: "reseller",
    telegram_id: targetId,
    data: {
      id: targetId,
      telegram_id: targetId,
      username: targetUsername,
      reseller_code: rCode,
      balance: bal,
      total_deposited: bal,
      total_licenses: 0,
      status: "active"
    },
    updated_at: Date.now()
  }
});

let msg = 
  "✅ <b>New Reseller Added Successfully!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Telegram ID:</b> <code>" + targetId + "</code>\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + rCode + "</code>\\n" +
  "💰 <b>Starting Balance:</b> ৳" + bal.toFixed(2) + " BDT\\n" +
  "💾 <b>Saved to Supabase:</b> 🟢 <code>ishak_bot_data</code>\\n\\n" +
  "রিসেলার এখন বট চালু করে ড্যাশবোর্ড ব্যবহার করতে পারবেন।";

Bot.sendMessage(msg, { parse_mode: "HTML" });

// Send welcome to new reseller
let welcomeReseller = 
  "🎉 <b>অভিনন্দন! আপনার TradePilot Reseller একাউন্ট অনুমোদিত হয়েছে।</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + rCode + "</code>\\n" +
  "💰 <b>Starting Balance:</b> ৳" + bal.toFixed(2) + " BDT\\n\\n" +
  "এখন /start চেপে আপনার রিসেলার মেনু ব্যবহার করুন:";

Api.sendMessage({ chat_id: targetId, text: welcomeReseller, parse_mode: "HTML" });
`,
  },

  // 34. ➖ Remove Reseller (Admin)
  {
    command: '➖ Remove Reseller',
    aliases: ['/remove_reseller', 'Remove Reseller'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.reseller&telegram_id=neq.8274806813&select=*&limit=10",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_remove_resellers"
});
`,
  },

  // 35. /on_show_remove_resellers
  {
    command: '/on_show_remove_resellers',
    need_reply: false,
    code: `
let rows = [];
try { rows = JSON.parse(content); } catch (e) {}

if (!rows || rows.length === 0) {
  Bot.sendMessage("ℹ️ রিমুভ করার মতো কোনো সাধারণ রিসেলার এই মুহূর্তে ডাটাবেজে নেই।");
  return;
}

let buttons = [];
for (let i = 0; i < rows.length; i++) {
  let r = rows[i].data;
  buttons.push([
    { text: "🗑️ Remove " + r.reseller_code + " (@" + (r.username || r.telegram_id) + ")", callback_data: "/do_remove_rsl " + r.telegram_id + " " + r.reseller_code }
  ]);
}

let text = 
  "➖ <b>Remove Reseller</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "যেই রিসেলারকে রিমুভ করতে চান তাকে নির্বাচন করুন:\\n" +
  "<i>(রিমুভ করলে রিসেলারের ড্যাশবোর্ড এক্সেস তাৎক্ষণিক বাতিল হবে ও Supabase থেকে মুছে যাবে)</i>";

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 36. /do_remove_rsl
  {
    command: '/do_remove_rsl',
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let targetId = parts[0];
let rCode = parts[1] || targetId;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + targetId,
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  },
  success: "/on_removed_rsl_done"
});

Api.sendMessage({
  chat_id: targetId,
  text: "⚠️ <b>আপনার TradePilot Reseller একাউন্ট বাতিল করা হয়েছে।</b>\\nবিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন: @IshakVhai",
  parse_mode: "HTML"
});
`,
  },

  // 37. /on_removed_rsl_done
  {
    command: '/on_removed_rsl_done',
    need_reply: false,
    code: `
Bot.sendMessage("✅ <b>Reseller Removed!</b>\\nরিসেলারকে সিস্টেম ও Supabase থেকে স্থায়ীভাবে রিমুভ করা হয়েছে।", { parse_mode: "HTML" });
`,
  },

  // 38. 👥 Manage Resellers
  {
    command: '👥 Manage Resellers',
    aliases: ['/manage_resellers', 'Manage Resellers'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.reseller&select=*&limit=15",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_resellers_list"
});
`,
  },

  // 39. /on_show_resellers_list
  {
    command: '/on_show_resellers_list',
    need_reply: false,
    code: `
let rows = [];
try { rows = JSON.parse(content); } catch (e) {}

let text = "👥 <b>Active Resellers List (" + (rows ? rows.length : 0) + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n\\n";
let buttons = [];

if (rows) {
  for (let i = 0; i < rows.length; i++) {
    let r = rows[i].data;
    text += "• <b>" + r.reseller_code + "</b> | TG: <code>" + r.telegram_id + "</code> (@" + (r.username || "N/A") + ")\\n";
    text += "  💰 Balance: <b>৳" + (r.balance || 0).toFixed(2) + "</b> | Licenses: " + (r.total_licenses || 0) + "\\n\\n";

    if (r.telegram_id != 8274806813) {
      buttons.push([
        { text: "🗑️ Remove " + r.reseller_code, callback_data: "/do_remove_rsl " + r.telegram_id + " " + r.reseller_code }
      ]);
    }
  }
}

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 40. 🔑 License Manager
  {
    command: '🔑 License Manager',
    aliases: ['/admin_licenses', 'License Manager'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/my_licenses");
`,
  },

  // 41. 📊 Bot Statistics
  {
    command: '📊 Bot Statistics',
    aliases: ['/admin_stats', 'Bot Statistics'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?select=count",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Range-Unit": "items",
    "Range": "0-0",
    "Prefer": "count=exact"
  },
  success: "/on_stats_supabase"
});
`,
  },

  // 42. /on_stats_supabase
  {
    command: '/on_stats_supabase',
    need_reply: false,
    code: `
let text = 
  "📊 <b>TradePilot Bot Statistics</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🤖 <b>Host:</b> Bots.Business 24/7 Cloud Engine\\n" +
  "💾 <b>Database:</b> Supabase (<code>ishak_bot_data</code> & <code>ishak_licenses</code>)\\n" +
  "🛡️ <b>Official Channel:</b> @trade_pilotbot\\n" +
  "👤 <b>Support Admin:</b> @IshakVhai\\n" +
  "⚡ <b>Engine Status:</b> 🟢 Active & 100% Operational";

Api.sendMessage({ text: text, parse_mode: "HTML" });
`,
  },

  // 43. ⚙️ Payment Settings
  {
    command: '⚙️ Payment Settings',
    aliases: ['/payment_settings', 'Payment Settings'],
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;

let bkash = Bot.getProperty("bkash_num", "01606398924");
let binance = Bot.getProperty("binance_id", "827480681");

let text = 
  "⚙️ <b>Payment Gateways Configuration</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🔴 <b>bKash Personal Number:</b> <code>" + bkash + "</code>\\n" +
  "🟡 <b>Binance Pay ID:</b> <code>" + binance + "</code>\\n\\n" +
  "পরিবর্তন করতে নিচের বাটন নির্বাচন করুন:";

let buttons = [
  [{ text: "🔴 Change bKash Number", callback_data: "/set_bkash_prompt" }],
  [{ text: "🟡 Change Binance Pay ID", callback_data: "/set_binance_prompt" }]
];

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 44. /set_bkash_prompt & save
  {
    command: '/set_bkash_prompt',
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/save_bkash");
Bot.sendMessage("🔴 নতুন <b>bKash Personal নম্বর</b> লিখে পাঠান:", { parse_mode: "HTML" });
`,
  },
  {
    command: '/save_bkash',
    need_reply: true,
    code: `
if (user.telegramid != 8274806813) return;
let num = (message || "").trim();
Bot.setProperty("bkash_num", num, "string");
Bot.sendMessage("✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>" + num + "</code>", { parse_mode: "HTML" });
`,
  },

  // 45. /set_binance_prompt & save
  {
    command: '/set_binance_prompt',
    need_reply: false,
    code: `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/save_binance");
Bot.sendMessage("🟡 নতুন <b>Binance Pay ID</b> লিখে পাঠান:", { parse_mode: "HTML" });
`,
  },
  {
    command: '/save_binance',
    need_reply: true,
    code: `
if (user.telegramid != 8274806813) return;
let id = (message || "").trim();
Bot.setProperty("binance_id", id, "string");
Bot.sendMessage("✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>" + id + "</code>", { parse_mode: "HTML" });
`,
  },

  // 46. 💬 Support
  {
    command: '💬 Support',
    aliases: ['/support', 'Support'],
    need_reply: false,
    code: `
let text = 
  "💬 <b>TradePilot Official Support</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "যেকোনো সহায়তার জন্য সরাসরি ইনবক্স করুন:\\n" +
  "👤 <b>Admin Support:</b> @IshakVhai\\n" +
  "📢 <b>Official Channel:</b> @trade_pilotbot";

let buttons = [
  [{ text: "💬 Contact @IshakVhai", url: "https://t.me/IshakVhai" }]
];

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,
  },

  // 47. 🔄 Device Reset
  {
    command: '🔄 Device Reset',
    aliases: ['/device_reset', 'Device Reset'],
    need_reply: false,
    code: `
let text = 
  "ℹ️ <b>Device Reset (HWID Unbind)</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনার কোনো লাইসেন্সে ডিভাইস বাইন্ড থাকলে <b>📜 My Licenses</b> অপশনে গিয়ে লাইসেন্সটি আনব্লক বা রিসেট করতে পারবেন।\\n\\n" +
  "কাস্টমার Quotex ট্রেডিং বটে লগইন করলেই লাইসেন্স স্বয়ংক্রিয়ভাবে বাইন্ড হয়।";

Api.sendMessage({ text: text, parse_mode: "HTML" });
`,
  },
];

// -------------------------------------------------------------
// RUNNER: FETCH EXISTING, DELETE OLD, CREATE NEW
// -------------------------------------------------------------

async function deploy() {
  console.log(`🚀 Starting Bots.Business deployment for Bot ID: ${BOT_ID}...`);

  // 1. Get existing commands
  const res = await apiRequest(`/bots/${BOT_ID}/commands`, 'GET');
  console.log(`📋 Existing commands count: ${res.data ? res.data.length : 0}`);

  // Delete any existing commands if needed
  if (res.data && Array.isArray(res.data) && res.data.length > 0) {
    for (const c of res.data) {
      console.log(`🗑️ Deleting old command: ${c.command} (#${c.id})`);
      await apiRequest(`/bots/${BOT_ID}/commands/${c.id}`, 'DELETE');
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 2. Create all commands
  let created = 0;
  for (const cmd of commands) {
    console.log(`➕ Creating command: ${cmd.command}...`);
    const payload = {
      command: cmd.command,
      code: (cmd.code || '').trim(),
      need_reply: cmd.need_reply || false,
      aliases: cmd.aliases || [],
    };

    const cRes = await apiRequest(`/bots/${BOT_ID}/commands`, 'POST', payload);
    if (cRes.status === 200 || cRes.status === 201) {
      console.log(`  ✅ Created: ${cmd.command} (ID: ${cRes.data ? cRes.data.id : 'OK'})`);
      created++;
    } else {
      console.error(`  ❌ Failed ${cmd.command}:`, cRes.status, cRes.data);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n🎉 Successfully deployed ${created}/${commands.length} commands to Bots.Business!`);
}

deploy().catch((err) => {
  console.error('Fatal deployment error:', err);
});
