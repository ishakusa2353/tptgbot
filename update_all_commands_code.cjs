/**
 * ==============================================================================
 * BOTS.BUSINESS CODE SYNC SCRIPT FOR BOT 3009407 (V4 - ALL 5 USER POINTS)
 * 1. Non-refundable license deletion policy enforced (zero balance return)
 * 2. Full Admin License Manager with all action buttons (Block/Unblock/Reset/Delete)
 * 3. Reseller My Licenses & My Licence full support with dual query matching
 * 4. Universal escape in all input handlers to prevent stuck/random messages
 * 5. Manual Add Balance for Admin with Chat ID / Reseller Code
 * ==============================================================================
 */

const https = require('https');

const API_KEY = 'AOU7VJYGmp26FZMlGej3nyKEzXCxpkSc_MQ3g5yV';
const BOT_ID = 3009407;

const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo';

function getCommandsList() {
  return new Promise((resolve, reject) => {
    https.get(`https://api.bots.business/v1/bots/${BOT_ID}/commands?api_key=${API_KEY}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function updateCommandCode(cmdId, code) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.bots.business/v1/bots/${BOT_ID}/commands/${cmdId}/code`);
    url.searchParams.append('api_key', API_KEY);

    const payload = JSON.stringify({ code: code.trim() });

    const req = https.request(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// BJS universal escape check snippet
const ESCAPE_CHECK = `
let inputMsg = (message || "").trim();
if (inputMsg.startsWith("/") || 
    inputMsg.indexOf("Panel") >= 0 ||
    inputMsg.indexOf("Reseller") >= 0 ||
    inputMsg.indexOf("License") >= 0 ||
    inputMsg.indexOf("Licence") >= 0 ||
    inputMsg.indexOf("Balance") >= 0 ||
    inputMsg.indexOf("Deposit") >= 0 ||
    inputMsg.indexOf("Settings") >= 0 ||
    inputMsg.indexOf("Broadcast") >= 0 ||
    inputMsg.indexOf("Statistics") >= 0 ||
    inputMsg.indexOf("Support") >= 0 ||
    inputMsg.indexOf("Reset") >= 0) {
  Bot.runCommand(inputMsg);
  return;
}
`;

// Complete BJS code map for all commands
const codeMap = {
  // -------------------------------------------------------------
  // /start - Handles user start, removes reply keyboard for guests
  // -------------------------------------------------------------
  '/start': `
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

  '/on_check_channel_start': `
let isMember = false;
try {
  let res = (typeof content === 'object') ? content : JSON.parse(content);
  if (res && res.ok && res.result) {
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

  Api.sendMessage({ 
    text: text, 
    parse_mode: "HTML", 
    reply_markup: { inline_keyboard: buttons } 
  });
  return;
}

Bot.runCommand("/show_menu");
`,

  '/verify_channel': `
HTTP.get({
  url: "https://api.telegram.org/bot9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ/getChatMember?chat_id=@trade_pilotbot&user_id=" + user.telegramid,
  success: "/on_check_channel_callback"
});
`,

  '/on_check_channel_callback': `
let isMember = false;
try {
  let res = (typeof content === 'object') ? content : JSON.parse(content);
  if (res && res.ok && res.result) {
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

  '/show_menu': `
let ownerId = 8274806813;

let ownerKeyboard = {
  keyboard: [
    [{ text: "👑 Owner Admin Panel" }, { text: "👥 Manage Resellers" }],
    [{ text: "➕ Add Reseller" }, { text: "➖ Remove Reseller" }],
    [{ text: "💰 Deposit Requests" }, { text: "💳 Add Balance" }],
    [{ text: "🔑 License Manager" }, { text: "⚙️ Payment Settings" }],
    [{ text: "📢 Broadcast" }, { text: "📊 Bot Statistics" }],
    [{ text: "💬 Support" }]
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
    "⚡ <b>Cloud Server:</b> 🟢 Active & 100% Operational\\n\\n" +
    "নিচের কিবোর্ড থেকে অপশন নির্বাচন করুন:";

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: ownerKeyboard });
  return;
}

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + user.telegramid + "&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_check_reseller_menu"
});
`,

  '/on_check_reseller_menu': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

var isResellerActive = false;
var r = null;

if (rows.length > 0 && rows[0].data && rows[0].data.status === "active") {
  isResellerActive = true;
  r = rows[0].data;
} else {
  var localR = Bot.getProperty("reseller_" + user.telegramid);
  if (localR && localR.status === "active") {
    isResellerActive = true;
    r = localR;
  }
}

if (isResellerActive && r) {
  let resellerKeyboard = {
    keyboard: [
      [{ text: "🔑 Generate VIP License" }, { text: "💳 My Balance" }],
      [{ text: "📜 My Licenses" }, { text: "💵 Deposit Request" }],
      [{ text: "🔄 Device Reset" }, { text: "💬 Support" }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };

  let curBal = Number(r.balance || 0);

  let text = 
    "💼 <b>Welcome to TradePilot Reseller Dashboard!</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
    "🏷️ <b>Reseller Code:</b> <code>" + r.reseller_code + "</code>\\n" +
    "💰 <b>Available Balance:</b> <b>৳" + curBal.toFixed(2) + " BDT</b>\\n" +
    "🔑 <b>Generated Licenses:</b> " + (r.total_licenses || 0) + "\\n" +
    "🛡️ <b>Status:</b> 🟢 Active Authorized Reseller\\n\\n" +
    "নিচের কিবোর্ড মেনু ব্যবহার করে কার্যক্রম পরিচালনা করুন:";

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: resellerKeyboard });
  return;
}

// Clean access denied for non-resellers with keyboard removed
let deniedText = 
  "⛔ <b>Access Denied!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n\\n" +
  "আপনি একজন অনুমোদিত <b>TradePilot Reseller</b> নন!\\n" +
  "রিসেলার একাউন্ট অ্যাক্টিভেশন ও অনুমোদনের জন্য আপনার উপরের <b>Chat ID</b> টি এডমিনকে জানিয়ে যোগাযোগ করুন।\\n\\n" +
  "👉 <b>Admin:</b> @IshakVhai";

Api.sendMessage({ 
  text: deniedText, 
  parse_mode: "HTML", 
  reply_markup: { remove_keyboard: true } 
});

Api.sendMessage({
  text: "📩 <b>রিসেলার এক্সেস আবেদন করতে নিচের বাটনে ক্লিক করুন:</b>",
  parse_mode: "HTML",
  reply_markup: {
    inline_keyboard: [
      [{ text: "📩 Contact Admin (@IshakVhai)", url: "https://t.me/IshakVhai" }]
    ]
  }
});
`,

  // -------------------------------------------------------------
  // POINT 5: MANUAL ADD BALANCE FOR ADMIN
  // -------------------------------------------------------------
  '💳 Add Balance': `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/on_manual_bal_target");
Bot.sendMessage("💳 <b>রিসেলারের একাউন্টে ম্যানুয়ালি ব্যালেন্স যোগ করুন</b>\\n━━━━━━━━━━━━━━━━━━━━━\\nরিসেলারের <b>Telegram Chat ID</b> অথবা <b>Reseller Code</b> লিখে পাঠান:\\n<i>(যেমন: 6643907270 অথবা TP-RSL-7710)</i>", { parse_mode: "HTML" });
`,

  '/on_manual_bal_target': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}

let target = inputMsg.replace("@", "").trim();
User.setProperty("manual_target_id", target, "string");

Bot.runCommand("/on_manual_bal_amount");
Bot.sendMessage("💰 <b>কত টাকা (BDT) ব্যালেন্স যোগ করতে চান তা সংখ্যায় লিখে পাঠান:</b>\\n<i>(যেমন: 500 বা 2000)</i>", { parse_mode: "HTML" });
`,

  '/on_manual_bal_amount': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}

let amt = parseFloat(inputMsg);
if (isNaN(amt) || amt <= 0) {
  Bot.sendMessage("⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500 বা 2000):");
  Bot.runCommand("/on_manual_bal_amount");
  return;
}

let target = User.getProperty("manual_target_id", "");
User.setProperty("manual_target_amt", amt, "float");

// Fetch target reseller
let query = target.startsWith("TP-RSL") ? ("data->>reseller_code=eq." + target) : ("id=eq.reseller:" + target);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?" + query + "&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_manual_bal_save"
});
`,

  '/on_manual_bal_save': `
var target = User.getProperty("manual_target_id", "");
var amt = Number(User.getProperty("manual_target_amt", 0));

var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];
var r = null;
var tgId = parseInt(target) || (rows.length > 0 && rows[0].telegram_id ? rows[0].telegram_id : null);

if (rows.length > 0 && rows[0].data) {
  r = rows[0].data;
  tgId = r.telegram_id || tgId;
} else if (tgId) {
  r = Bot.getProperty("reseller_" + tgId);
}

if (!r && tgId) {
  r = {
    id: tgId,
    telegram_id: tgId,
    reseller_code: "TP-RSL-" + tgId,
    balance: 0,
    total_deposited: 0,
    status: "active"
  };
}

if (!r || !tgId) {
  Bot.sendMessage("❌ <b>রিসেলার পাওয়া যায়নি!</b>\\nঅনুগ্রহ করে সঠিক Telegram ID দিয়ে পুনরায় চেষ্টা করুন।", { parse_mode: "HTML" });
  return;
}

var curBal = Number(r.balance || 0);
var newBal = curBal + amt;
var curTot = Number(r.total_deposited || 0);
var newTot = curTot + amt;
r.balance = newBal;
r.total_deposited = newTot;
r.status = "active";

// Save to Supabase
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
  },
  body: {
    id: "reseller:" + tgId,
    type: "reseller",
    telegram_id: tgId,
    data: r,
    updated_at: Date.now()
  }
});

// Save to Bot local cache
Bot.setProperty("bal_" + tgId, newBal, "float");
Bot.setProperty("reseller_" + tgId, r, "json");

var localList = Bot.getProperty("reseller_list", []);
var found = false;
for (var i = 0; i < localList.length; i++) {
  if (localList[i].telegram_id == tgId) {
    localList[i] = r;
    found = true;
    break;
  }
}
if (!found) localList.push(r);
Bot.setProperty("reseller_list", localList, "json");

// Notify Admin
let adminMsg = 
  "✅ <b>ব্যালেন্স যোগ সফল হয়েছে!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "👤 <b>Reseller:</b> <code>" + r.reseller_code + "</code> (TG: " + tgId + ")\\n" +
  "💵 <b>যোগকৃত অর্থ:</b> <b>+৳" + amt.toFixed(2) + " BDT</b>\\n" +
  "💰 <b>বর্তমান মোট ব্যালেন্স:</b> <b>৳" + newBal.toFixed(2) + " BDT</b>";
Bot.sendMessage(adminMsg, { parse_mode: "HTML" });

// Notify Reseller
let notifyMsg = 
  "🎉 <b>এডমিন আপনার একাউন্টে ব্যালেন্স যোগ করেছেন!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "💵 <b>যোগকৃত অর্থ:</b> <b>+৳" + amt.toFixed(2) + " BDT</b>\\n" +
  "💰 <b>আপনার বর্তমান ব্যালেন্স:</b> <b>৳" + newBal.toFixed(2) + " BDT</b>\\n\\n" +
  "এখন আপনি <b>\\"🔑 Generate VIP License\\"</b> বাটন দিয়ে লাইসেন্স তৈরি করতে পারবেন।";
Api.sendMessage({ chat_id: tgId, text: notifyMsg, parse_mode: "HTML" });
`,

  // -------------------------------------------------------------
  // POINT 2: ADMIN ALL LICENSES WITH ACTION BUTTONS
  // -------------------------------------------------------------
  '🔑 License Manager': `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?select=*&order=created_at.desc&limit=25&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_admin_all_licenses"
});
`,

  '🔑 Licence Manager': `Bot.runCommand("🔑 License Manager");`,
  'Licence Manage': `Bot.runCommand("🔑 License Manager");`,
  'License Manage': `Bot.runCommand("🔑 License Manager");`,

  '/on_show_admin_all_licenses': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

var cleanRows = [];
for (var i = 0; i < rows.length; i++) {
  if (rows[i].key && rows[i].key !== "__MAINTENANCE_CONFIG__") {
    cleanRows.push(rows[i]);
  }
}

if (!cleanRows || cleanRows.length === 0) {
  Bot.sendMessage("ℹ️ সিস্টেম ডাটাবেজে কোনো লাইসেন্স পাওয়া যায়নি।", { parse_mode: "HTML" });
  return;
}

let header = "👑 <b>VIP License Manager (মোট: " + cleanRows.length + " টি)</b>\\n━━━━━━━━━━━━━━━━━━━━━\\nসিস্টেমের সকল লাইসেন্স ও একশন বাটন নিচে দেওয়া হলো:";
Api.sendMessage({ text: header, parse_mode: "HTML" });

let maxShow = Math.min(cleanRows.length, 10);
for (let j = 0; j < maxShow; j++) {
  let lic = cleanRows[j];
  let statusBadge = lic.active ? "🟢 Active" : "🚫 Blocked";
  let devText = lic.device_id ? ("🔒 Bound: <code>" + lic.device_id + "</code>") : "🔓 Unbound";
  let noteText = lic.note ? lic.note.replace("[DEV_LIMIT:1] ", "") : "N/A";

  let msg = 
    "🔑 <b>Key:</b> <code>" + lic.key + "</code>\\n" +
    "⏱️ <b>Plan:</b> " + (lic.duration || "VIP") + " | <b>Tier:</b> " + (lic.tier || "VIP") + "\\n" +
    "🛡️ <b>Status:</b> " + statusBadge + "\\n" +
    "📱 <b>Device:</b> " + devText + "\\n" +
    "👤 <b>Info:</b> " + noteText;

  let btns = [
    [
      { text: lic.active ? "🚫 Block" : "🟢 Unblock", callback_data: (lic.active ? "/block_lic " : "/unblock_lic ") + lic.key },
      { text: "🔄 Reset Device", callback_data: "/do_device_reset " + lic.key }
    ],
    [
      { text: "🗑️ Delete License", callback_data: "/del_prompt " + lic.key }
    ]
  ];

  Api.sendMessage({ text: msg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns } });
}
`,

  // -------------------------------------------------------------
  // POINT 3: RESELLER MY LICENSES (ALL VARIATIONS & DUAL LOOKUP)
  // -------------------------------------------------------------
  '📜 My Licenses': `
let ownerId = 8274806813;
if (user.telegramid == ownerId) {
  Bot.runCommand("🔑 License Manager");
  return;
}

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?select=*&note=ilike.%25" + user.telegramid + "%25&order=created_at.desc&limit=15&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_licenses_list"
});
`,

  '📜 My Licence': `Bot.runCommand("📜 My Licenses");`,
  'My Licenses': `Bot.runCommand("📜 My Licenses");`,
  'My Licence': `Bot.runCommand("📜 My Licenses");`,
  '/my_licenses': `Bot.runCommand("📜 My Licenses");`,
  '/my_licence': `Bot.runCommand("📜 My Licenses");`,

  '/on_show_licenses_list': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

if (!rows || rows.length === 0) {
  // Dual Query Fallback to ishak_bot_data
  HTTP.get({
    url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.license&telegram_id=eq." + user.telegramid + "&select=*&limit=15&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    headers: {
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
    },
    success: "/on_show_licenses_backup_list"
  });
  return;
}

Bot.sendMessage("📜 <b>My Generated Licenses (" + rows.length + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━", { parse_mode: "HTML" });

for (let i = 0; i < rows.length; i++) {
  let lic = rows[i];
  let statusBadge = lic.active ? "🟢 Active" : "🚫 Blocked";
  let devText = lic.device_id ? ("🔒 Bound: <code>" + lic.device_id + "</code>") : "🔓 Unbound";

  let msg = 
    "🔑 <b>Key:</b> <code>" + lic.key + "</code>\\n" +
    "⏱️ <b>Plan:</b> " + (lic.duration || "VIP") + "\\n" +
    "🛡️ <b>Status:</b> " + statusBadge + "\\n" +
    "📱 <b>Device:</b> " + devText;

  let btns = [
    [
      { text: lic.active ? "🚫 Block" : "🟢 Unblock", callback_data: (lic.active ? "/block_lic " : "/unblock_lic ") + lic.key },
      { text: "🔄 Reset Device", callback_data: "/do_device_reset " + lic.key }
    ],
    [
      { text: "🗑️ Delete", callback_data: "/del_prompt " + lic.key }
    ]
  ];

  Api.sendMessage({ text: msg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns } });
}
`,

  // -------------------------------------------------------------
  // POINT 1: NON-REFUNDABLE LICENSE DELETION (ZERO BALANCE RETURN)
  // -------------------------------------------------------------
  '/del_prompt': `
let key = (params || "").trim();
let buttons = [
  [{ text: "🗑️ হ্যাঁ, নিশ্চিত ডিলিট করুন", callback_data: "/del_confirm " + key }],
  [{ text: "❌ বাতিল", callback_data: "/my_licenses" }]
];

let text = 
  "⚠️ <b>Delete Confirmation!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনি কি নিশ্চিতভাবে এই লাইসেন্সটি সিস্টেম থেকে চিরতরে মুছে ফেলতে চান?\\n\\n" +
  "🔑 <b>Key:</b> <code>" + key + "</code>\\n\\n" +
  "⚠️ <b>সতর্কবার্তা:</b> লাইসেন্স ডিলিট করলে এর জন্য কর্তনকৃত অর্থ কখনো ব্যালেন্সে ফেরত আসবে না (Non-refundable)। কাস্টমার আর এই কি দিয়ে লগইন করতে পারবে না।";

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,

  '/del_confirm': `
let key = (params || "").trim();

// Delete from ishak_licenses without ANY refund
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  },
  success: "/on_del_done"
});

// Also delete from ishak_bot_data
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.license:" + key + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  }
});
`,

  '/on_del_done': `
Bot.sendMessage("🗑️ <b>License Deleted!</b>\\nলাইসেন্সটি সিস্টেম থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।\\n<i>(কোনো প্রকার রিফান্ড বা ব্যালেন্স ব্যাক প্রযোজ্য নয়)</i>", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,

  // -------------------------------------------------------------
  // POINT 4: UNIVERSAL ESCAPE IN INPUT HANDLERS (NO STUCK/RANDOM MSGS)
  // -------------------------------------------------------------
  '/on_dep_amt_input': `
${ESCAPE_CHECK}
let amt = parseFloat(inputMsg);
if (isNaN(amt) || amt < 10) {
  Bot.sendMessage("⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500 বা 1000):");
  Bot.runCommand("/on_dep_amt_input");
  return;
}

User.setProperty("dep_amount", amt, "float");
Bot.runCommand("/on_dep_trx_input");
Bot.sendMessage("📝 <b>Transaction ID (TrxID) / Payment ID লিখে পাঠান:</b>", { parse_mode: "HTML" });
`,

  '/on_dep_trx_input': `
${ESCAPE_CHECK}
let trx = inputMsg.toUpperCase();
if (trx.length < 4) {
  Bot.sendMessage("⚠️ সঠিক Transaction ID দিন (কমপক্ষে ৪ অক্ষর):");
  Bot.runCommand("/on_dep_trx_input");
  return;
}

User.setProperty("dep_trx", trx, "string");
Bot.runCommand("/on_dep_sender_input");
Bot.sendMessage("📱 <b>Sender Number / Binance Pay ID লিখে পাঠান:</b>", { parse_mode: "HTML" });
`,

  '/on_dep_sender_input': `
${ESCAPE_CHECK}
let sender = inputMsg;
let method = User.getProperty("dep_method", "bKash Personal");
let amt = User.getProperty("dep_amount", 500);
let trx = User.getProperty("dep_trx", "TRX12345");
let depId = Math.floor(100 + Math.random() * 900);
let rCode = User.getProperty("reseller_code", "TP-RSL-" + user.telegramid);

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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

  '/on_add_rsl_target': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}

let cleanTarget = inputMsg.replace("@", "").trim();
let targetId = parseInt(cleanTarget) || Math.floor(100000000 + Math.random() * 900000000);

User.setProperty("target_rsl_id", targetId, "integer");
User.setProperty("target_rsl_user", cleanTarget, "string");

Bot.runCommand("/on_add_rsl_bal");
Bot.sendMessage("💰 <b>নতুন রিসেলারের একাউন্টে প্রাথমিক ব্যালেন্স কত যোগ করতে চান?</b>\\n<i>(BDT সংখ্যায় লিখুন, যেমন: 1000 বা 5000)</i>", { parse_mode: "HTML" });
`,

  '/on_add_rsl_bal': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}

let bal = parseFloat(inputMsg) || 0;
let targetId = User.getProperty("target_rsl_id");
let targetUsername = User.getProperty("target_rsl_user");
let rCode = "TP-RSL-" + Math.floor(1000 + Math.random() * 9000);

let rData = {
  id: targetId,
  telegram_id: targetId,
  username: targetUsername,
  reseller_code: rCode,
  balance: bal,
  total_deposited: bal,
  total_licenses: 0,
  status: "active"
};

// 1. Save to Supabase
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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
    data: rData,
    updated_at: Date.now()
  }
});

// 2. Save to local cache
var localList = Bot.getProperty("reseller_list", []);
var exists = false;
for (var i = 0; i < localList.length; i++) {
  if (localList[i].telegram_id == targetId) {
    localList[i] = rData;
    exists = true;
    break;
  }
}
if (!exists) localList.push(rData);
Bot.setProperty("reseller_list", localList, "json");
Bot.setProperty("reseller_" + targetId, rData, "json");
Bot.setProperty("bal_" + targetId, bal, "float");

let msg = 
  "✅ <b>New Reseller Added Successfully!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Telegram ID:</b> <code>" + targetId + "</code>\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + rCode + "</code>\\n" +
  "💰 <b>Starting Balance:</b> ৳" + bal.toFixed(2) + " BDT\\n" +
  "🛡️ <b>Status:</b> 🟢 Authorized & Synchronized\\n\\n" +
  "রিসেলার এখন বট চালু করে ড্যাশবোর্ড ব্যবহার করতে পারবেন।";

Bot.sendMessage(msg, { parse_mode: "HTML" });

// Send welcome to reseller
let welcomeReseller = 
  "🎉 <b>অভিনন্দন! আপনার TradePilot Reseller একাউন্ট অনুমোদিত হয়েছে।</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + rCode + "</code>\\n" +
  "💰 <b>Starting Balance:</b> ৳" + bal.toFixed(2) + " BDT\\n\\n" +
  "এখন /start চেপে আপনার রিসেলার মেনু ব্যবহার করুন:";

Api.sendMessage({ chat_id: targetId, text: welcomeReseller, parse_mode: "HTML" });
`,

  '/save_bkash': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}
let num = inputMsg;
Bot.setProperty("bkash_num", num, "string");
Bot.sendMessage("✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>" + num + "</code>", { parse_mode: "HTML" });
`,

  '/save_binance': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}
let id = inputMsg;
Bot.setProperty("binance_id", id, "string");
Bot.sendMessage("✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>" + id + "</code>", { parse_mode: "HTML" });
`,

  '/on_broadcast_input': `
if (user.telegramid != 8274806813) return;
${ESCAPE_CHECK}
let broadcastMsg = inputMsg;
if (!broadcastMsg) return;

Bot.setProperty("pending_broadcast_text", broadcastMsg, "string");

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.reseller&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_do_broadcast_send"
});
`
};

async function syncAllCode() {
  console.log(`📡 Fetching commands for bot ${BOT_ID}...`);
  const list = await getCommandsList();
  console.log(`Found ${list.length} commands.`);

  let updated = 0;
  for (const cmd of list) {
    const code = codeMap[cmd.command];
    if (code) {
      console.log(`⚙️ Updating code for command: ${cmd.command} (#${cmd.id})...`);
      try {
        const res = await updateCommandCode(cmd.id, code);
        if (res.status === 200 || res.status === 204) {
          console.log(`  ✅ Successfully updated: ${cmd.command}`);
          updated++;
        } else {
          console.warn(`  ⚠️ Response status ${res.status} for ${cmd.command}`);
        }
      } catch (e) {
        console.error(`  ❌ Error updating ${cmd.command}:`, e.message);
      }
      await new Promise((r) => setTimeout(r, 120));
    } else {
      console.log(`  ⏩ Skipping ${cmd.command} (unchanged)`);
    }
  }

  console.log(`\n🎉 Code sync complete! Successfully updated ${updated} commands with complete fixes.`);
}

syncAllCode().catch(console.error);
