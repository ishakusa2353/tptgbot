/**
 * ==============================================================================
 * BOTS.BUSINESS CODE SYNC SCRIPT FOR BOT 3009407 (V2 - BULLETPROOF FIXES)
 * Pushes BJS code to https://api.bots.business/v1/bots/:id/commands/:cmd_id/code
 * ==============================================================================
 */

const https = require('https');

const API_KEY = 'AOU7VJYGmp26FZMlGej3nyKEzXCxpkSc_MQ3g5yV';
const BOT_ID = 3009407;

const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo';
const SUPABASE_BASE = 'https://qbazzarqiplrqqfytajz.supabase.co/rest/v1';

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

// BJS safe response parser preamble snippet injected into handlers
const PARSER_SNIPPET = `
function parseResp(c, d) {
  var raw = (typeof c !== 'undefined' && c !== null) ? c : ((typeof d !== 'undefined' && d) ? d.content : null);
  if (typeof raw === 'object' && raw !== null) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return null;
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

// Check Reseller in Supabase with apikey query param for bulletproof auth
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

// Check active status in Supabase or local cache
var isResellerActive = false;
var r = null;

if (rows.length > 0 && rows[0].data && rows[0].data.status === "active") {
  isResellerActive = true;
  r = rows[0].data;
} else {
  // Check local fallback
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

// Access Denied for Guests - REMOVE REPLY KEYBOARD COMPLETELY SO NON-RESELLERS SEE NO BOTTOM BUTTONS
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
  // ADMIN PANEL: MANAGE RESELLERS (FIXED 0 RESELLER BUG)
  // -------------------------------------------------------------
  '👥 Manage Resellers': `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.reseller&select=*&limit=50&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_resellers_list"
});
`,

  '/on_show_resellers_list': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

// Local cache fallback
if (rows.length === 0) {
  var localList = Bot.getProperty("reseller_list", []);
  if (localList && localList.length > 0) {
    for (var k = 0; k < localList.length; k++) {
      rows.push({
        id: "reseller:" + localList[k].telegram_id,
        type: "reseller",
        telegram_id: localList[k].telegram_id,
        data: localList[k]
      });
    }
  }
}

let text = "👥 <b>Active Resellers List (" + rows.length + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n\\n";
let buttons = [];

for (let i = 0; i < rows.length; i++) {
  let r = rows[i].data || {};
  let tg = r.telegram_id || rows[i].telegram_id;
  let code = r.reseller_code || ("TP-RSL-" + tg);
  let bal = Number(r.balance || 0);
  let lics = Number(r.total_licenses || 0);

  text += "• <b>" + code + "</b> | TG: <code>" + tg + "</code>\\n";
  text += "  💰 Balance: <b>৳" + bal.toFixed(2) + "</b> | Licenses: " + lics + "\\n\\n";

  if (tg != 8274806813) {
    buttons.push([
      { text: "🗑️ Remove " + code, callback_data: "/do_remove_rsl " + tg + " " + code }
    ]);
  }
}

if (buttons.length > 0) {
  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
} else {
  Api.sendMessage({ text: text, parse_mode: "HTML" });
}
`,

  // -------------------------------------------------------------
  // ADMIN PANEL: REMOVE RESELLER (FIXED)
  // -------------------------------------------------------------
  '➖ Remove Reseller': `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.reseller&telegram_id=neq.8274806813&select=*&limit=30&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_remove_resellers"
});
`,

  '/on_show_remove_resellers': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

// Local cache fallback
if (rows.length === 0) {
  var localList = Bot.getProperty("reseller_list", []);
  if (localList && localList.length > 0) {
    for (var k = 0; k < localList.length; k++) {
      if (localList[k].telegram_id != 8274806813) {
        rows.push({
          id: "reseller:" + localList[k].telegram_id,
          type: "reseller",
          telegram_id: localList[k].telegram_id,
          data: localList[k]
        });
      }
    }
  }
}

if (!rows || rows.length === 0) {
  Bot.sendMessage("ℹ️ রিমুভ করার মতো কোনো সাধারণ রিসেলার এই মুহূর্তে ডাটাবেজে নেই।");
  return;
}

let buttons = [];
for (let i = 0; i < rows.length; i++) {
  let r = rows[i].data || {};
  let tg = r.telegram_id || rows[i].telegram_id;
  let code = r.reseller_code || ("TP-RSL-" + tg);
  buttons.push([
    { text: "🗑️ Remove " + code + " (TG: " + tg + ")", callback_data: "/do_remove_rsl " + tg + " " + code }
  ]);
}

let text = 
  "➖ <b>Remove Reseller</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "যেই রিসেলারকে রিমুভ করতে চান তাকে নির্বাচন করুন:\\n" +
  "<i>(রিমুভ করলে রিসেলারের ড্যাশবোর্ড এক্সেস তাৎক্ষণিক বাতিল হবে ও Supabase থেকে মুছে যাবে)</i>";

Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
`,

  '/do_remove_rsl': `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let targetId = parts[0];
let rCode = parts[1] || targetId;

// Delete from Supabase
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + targetId + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  },
  success: "/on_removed_rsl_done"
});

// Remove from local cache
var localList = Bot.getProperty("reseller_list", []);
var filtered = [];
for (var i = 0; i < localList.length; i++) {
  if (localList[i].telegram_id != targetId) filtered.push(localList[i]);
}
Bot.setProperty("reseller_list", filtered, "json");
Bot.setProperty("reseller_" + targetId, null);

// Notify the removed user
Api.sendMessage({
  chat_id: targetId,
  text: "⚠️ <b>আপনার TradePilot Reseller একাউন্ট বাতিল করা হয়েছে।</b>\\nবিস্তারিত জানতে এডমিনের সাথে যোগাযোগ করুন: @IshakVhai",
  parse_mode: "HTML",
  reply_markup: { remove_keyboard: true }
});
`,

  '/on_removed_rsl_done': `
Bot.sendMessage("✅ <b>Reseller Removed!</b>\\nরিসেলারকে সিস্টেম ও Supabase থেকে স্থায়ীভাবে রিমুভ করা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("👥 Manage Resellers");
`,

  // -------------------------------------------------------------
  // ADMIN PANEL: ADD RESELLER
  // -------------------------------------------------------------
  '➕ Add Reseller': `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/on_add_rsl_target");
Bot.sendMessage("➕ <b>নতুন রিসেলারের Telegram Chat ID অথবা Username লিখে পাঠান:</b>\\n<i>(উদাহরণ: 6643907270 অথবা @IshakVhai)</i>", { parse_mode: "HTML" });
`,

  '/on_add_rsl_target': `
if (user.telegramid != 8274806813) return;
let cleanTarget = (message || "").replace("@", "").trim();
let targetId = parseInt(cleanTarget) || Math.floor(100000000 + Math.random() * 900000000);

User.setProperty("target_rsl_id", targetId, "integer");
User.setProperty("target_rsl_user", cleanTarget, "string");

Bot.runCommand("/on_add_rsl_bal");
Bot.sendMessage("💰 <b>নতুন রিসেলারের একাউন্টে প্রাথমিক ব্যালেন্স কত যোগ করতে চান?</b>\\n<i>(BDT সংখ্যায় লিখুন, যেমন: 1000 বা 5000)</i>", { parse_mode: "HTML" });
`,

  '/on_add_rsl_bal': `
if (user.telegramid != 8274806813) return;

let bal = parseFloat(message) || 0;
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
  "💾 <b>Saved to Supabase:</b> 🟢 <code>ishak_bot_data</code>\\n\\n" +
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

  // -------------------------------------------------------------
  // DEPOSIT APPROVAL & BALANCE UPDATE (FIXED 0 BALANCE BUG)
  // -------------------------------------------------------------
  '/approve_dep': `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let depId = parts[0];
let targetTgId = parseInt(parts[1]);
let amt = parseFloat(parts[2]) || 0;

Bot.setProperty("active_appr_dep_id", depId, "string");
Bot.setProperty("active_appr_tg_id", targetTgId, "integer");
Bot.setProperty("active_appr_amt", amt, "float");

// Fetch existing reseller from Supabase
HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq.reseller:" + targetTgId + "&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_approve_dep_save"
});
`,

  '/on_approve_dep_save': `
var depId = Bot.getProperty("active_appr_dep_id");
var targetTgId = Bot.getProperty("active_appr_tg_id");
var amt = Number(Bot.getProperty("active_appr_amt", 0));

var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];
var r = null;

if (rows.length > 0 && rows[0].data) {
  r = rows[0].data;
} else {
  // Check local fallback
  r = Bot.getProperty("reseller_" + targetTgId);
}

if (!r) {
  r = {
    id: targetTgId,
    telegram_id: targetTgId,
    reseller_code: "TP-RSL-" + targetTgId,
    balance: 0,
    total_deposited: 0,
    status: "active"
  };
}

var currentBal = Number(r.balance || 0);
var newBal = currentBal + amt;
var currentTot = Number(r.total_deposited || 0);
var newTot = currentTot + amt;

r.balance = newBal;
r.total_deposited = newTot;
r.status = "active";

// 1. Update Reseller in Supabase
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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

// 2. Save in local cache & properties
Bot.setProperty("reseller_" + targetTgId, r, "json");
Bot.setProperty("bal_" + targetTgId, newBal, "float");

var localList = Bot.getProperty("reseller_list", []);
var found = false;
for (var i = 0; i < localList.length; i++) {
  if (localList[i].telegram_id == targetTgId) {
    localList[i] = r;
    found = true;
    break;
  }
}
if (!found) localList.push(r);
Bot.setProperty("reseller_list", localList, "json");

// Notify Admin
Bot.sendMessage("✅ <b>Deposit #" + depId + " Approved!</b>\\n👤 রিসেলার: <code>" + r.reseller_code + "</code> (TG: " + targetTgId + ")\\n💵 যোগকৃত অর্থ: <b>৳" + amt.toFixed(2) + "</b>\\n💰 বর্তমান ব্যালেন্স: <b>৳" + newBal.toFixed(2) + "</b>", { parse_mode: "HTML" });

// Notify Reseller
let notifyText = 
  "🎉 <b>Deposit Approved!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনার <b>৳" + amt.toFixed(2) + " BDT</b> ডিপোজিট সফলভাবে অনুমোদিত হয়েছে।\\n\\n" +
  "💰 <b>বর্তমান ব্যালেন্স:</b> <b>৳" + newBal.toFixed(2) + " BDT</b>\\n\\n" +
  "এখন আপনি <b>\\"🔑 Generate VIP License\\"</b> বাটন দিয়ে লাইসেন্স তৈরি করতে পারবেন।";

Api.sendMessage({ chat_id: targetTgId, text: notifyText, parse_mode: "HTML" });
`,

  '/reject_dep': `
if (user.telegramid != 8274806813) return;

let parts = (params || "").split(" ");
let depId = parts[0];
let targetTgId = parseInt(parts[1]);
let amt = parseFloat(parts[2]) || 0;
let trx = parts[3] || "N/A";

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
  [{ text: "💵 Submit New Deposit", callback_data: "/dep_step_amt bkash" }]
];

Api.sendMessage({ chat_id: targetTgId, text: rejectMsg, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
Bot.sendMessage("❌ <b>Deposit #" + depId + " Rejected!</b>\\nরিসেলারকে তাৎক্ষণিক রিজেকশন নোটিফিকেশন পাঠানো হয়েছে।", { parse_mode: "HTML" });
`,

  // -------------------------------------------------------------
  // OWNER DEPOSIT REQUESTS LIST
  // -------------------------------------------------------------
  '💰 Deposit Requests': `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?type=eq.deposit&select=*&limit=15&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_pending_deposits"
});
`,

  '/on_show_pending_deposits': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];
var pending = [];

for (var i = 0; i < rows.length; i++) {
  var d = rows[i].data;
  if (d && d.status === "pending") pending.push(d);
}

if (pending.length === 0) {
  Bot.sendMessage("ℹ️ <b>এই মুহূর্তে কোনো পেন্ডিং ডিপোজিট রিকোয়েস্ট নেই।</b>", { parse_mode: "HTML" });
  return;
}

for (var j = 0; j < pending.length; j++) {
  var item = pending[j];
  var text = 
    "💰 <b>Deposit Request #" + item.id + "</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "👤 <b>Reseller:</b> <code>" + item.reseller_code + "</code> (TG: " + item.telegram_id + ")\\n" +
    "💳 <b>Method:</b> " + item.method + "\\n" +
    "💵 <b>Amount:</b> <b>৳" + Number(item.amount).toFixed(2) + "</b>\\n" +
    "🔢 <b>TrxID:</b> <code>" + item.transaction_id + "</code>\\n" +
    "📱 <b>Sender:</b> <code>" + item.sender + "</code>";

  var buttons = [
    [
      { text: "✅ Approve (+৳" + item.amount + ")", callback_data: "/approve_dep " + item.id + " " + item.telegram_id + " " + item.amount },
      { text: "❌ Reject", callback_data: "/reject_dep " + item.id + " " + item.telegram_id + " " + item.amount + " " + item.transaction_id }
    ]
  ];

  Api.sendMessage({ text: text, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
}
`,

  // -------------------------------------------------------------
  // RESELLER: MY BALANCE (FIXED 0 BALANCE DISPLAY)
  // -------------------------------------------------------------
  '💳 My Balance': `
let ownerId = 8274806813;
let queryId = (user.telegramid == ownerId) ? "reseller:8274806813" : ("reseller:" + user.telegramid);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq." + queryId + "&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_my_balance"
});
`,

  '/on_show_my_balance': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];
var r = null;

if (rows.length > 0 && rows[0].data) {
  r = rows[0].data;
} else {
  // Check local fallback
  r = Bot.getProperty("reseller_" + user.telegramid);
}

if (!r) {
  r = {
    reseller_code: (user.telegramid == 8274806813 ? "TP-RSL-OWNER" : ("TP-RSL-" + user.telegramid)),
    balance: (user.telegramid == 8274806813 ? 100000 : Number(Bot.getProperty("bal_" + user.telegramid, 0))),
    total_deposited: 0,
    total_licenses: 0
  };
}

var bal = Number(r.balance || Bot.getProperty("bal_" + user.telegramid, 0));
var tot = Number(r.total_deposited || bal);

let text = 
  "💳 <b>My Balance Information</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🆔 <b>Your Chat ID:</b> <code>" + user.telegramid + "</code>\\n" +
  "🏷️ <b>Reseller Code:</b> <code>" + r.reseller_code + "</code>\\n" +
  "💰 <b>Available Balance:</b> <b>৳" + bal.toFixed(2) + " BDT</b> (≈ $" + (bal / 125).toFixed(2) + " USD)\\n" +
  "📥 <b>Total Deposited:</b> ৳" + tot.toFixed(2) + "\\n" +
  "🔑 <b>Generated Licenses:</b> " + (r.total_licenses || 0) + "\\n" +
  "🛡️ <b>Database Sync:</b> 🟢 Supabase Cloud (<code>ishak_bot_data</code>)\\n\\n" +
  "ব্যালেন্স রিচার্জ করতে নিচের <b>\\"💵 Deposit Request\\"</b> বাটন ব্যবহার করুন।";

Api.sendMessage({ text: text, parse_mode: "HTML" });
`,

  // -------------------------------------------------------------
  // ADMIN PANEL: BROADCAST (FIXED)
  // -------------------------------------------------------------
  '📢 Broadcast': `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/on_broadcast_input");
Bot.sendMessage("📢 <b>Admin Announcement / Broadcast Message</b>\\n━━━━━━━━━━━━━━━━━━━━━\\nসকল অনুমোদিত রিসেলারের কাছে যে মেসেজটি পাঠাতে চান তা লিখে পাঠান:\\n<i>(মেসেজটি লিখলেই তা স্বয়ংক্রিয়ভাবে সকল রিসেলারের ইনবক্সে চলে যাবে)</i>", { parse_mode: "HTML" });
`,

  '/on_broadcast_input': `
if (user.telegramid != 8274806813) return;
let broadcastMsg = (message || "").trim();
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
`,

  '/on_do_broadcast_send': `
var broadcastMsg = Bot.getProperty("pending_broadcast_text", "");
if (!broadcastMsg) return;

var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

// Local cache fallback
if (rows.length === 0) {
  var localList = Bot.getProperty("reseller_list", []);
  if (localList && localList.length > 0) {
    for (var k = 0; k < localList.length; k++) {
      rows.push({ telegram_id: localList[k].telegram_id, data: localList[k] });
    }
  }
}

let sentCount = 0;
let text = 
  "📢 <b>অফিসিয়াল ঘোষণা / Admin Announcement</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  broadcastMsg + "\\n\\n" +
  "— <b>TradePilot Admin (@IshakVhai)</b>";

for (let i = 0; i < rows.length; i++) {
  let tg = rows[i].telegram_id || (rows[i].data ? rows[i].data.telegram_id : null);
  if (tg && tg != 8274806813) {
    try {
      Api.sendMessage({ chat_id: tg, text: text, parse_mode: "HTML" });
      sentCount++;
    } catch (e) {}
  }
}

Bot.sendMessage("✅ <b>ব্রডকাস্ট সম্পন্ন!</b>\\nমোট <b>" + sentCount + "</b> জন অনুমোদিত রিসেলারের কাছে বার্তা পাঠানো হয়েছে।", { parse_mode: "HTML" });
`,

  // -------------------------------------------------------------
  // ADMIN PANEL: LICENSE MANAGER (FIXED)
  // -------------------------------------------------------------
  '🔑 License Manager': `
if (user.telegramid != 8274806813) return;

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?order=created_at.desc&limit=15&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_admin_all_licenses"
});
`,

  '/my_licenses': `
if (user.telegramid == 8274806813) {
  Bot.runCommand("🔑 License Manager");
} else {
  Bot.runCommand("📜 My Licenses");
}
`,

  '/on_show_admin_all_licenses': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

if (!rows || rows.length === 0) {
  Bot.sendMessage("ℹ️ ডাটাবেজে কোনো লাইসেন্স পাওয়া যায়নি।", { parse_mode: "HTML" });
  return;
}

Bot.sendMessage("🔑 <b>TradePilot System All VIP Licenses (" + rows.length + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━", { parse_mode: "HTML" });

for (let i = 0; i < rows.length; i++) {
  let lic = rows[i];
  let statusBadge = lic.active ? "🟢 Active" : "🚫 Blocked";
  let hwidText = lic.hwid ? ("🔒 Bound: <code>" + lic.hwid + "</code>") : "🔓 Unbound";

  let msg = 
    "🔑 <b>Key:</b> <code>" + lic.key + "</code>\\n" +
    "⏱️ <b>Plan:</b> " + (lic.duration || "VIP") + " | <b>Tier:</b> " + (lic.tier || "VIP") + "\\n" +
    "🛡️ <b>Status:</b> " + statusBadge + "\\n" +
    "📱 <b>Device:</b> " + hwidText;

  let btns = [
    [
      { text: lic.active ? "🚫 Block" : "🟢 Unblock", callback_data: (lic.active ? "/block_lic " : "/unblock_lic ") + lic.key },
      { text: "🗑️ Delete", callback_data: "/del_prompt " + lic.key }
    ]
  ];

  Api.sendMessage({ text: msg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns } });
}
`,

  // -------------------------------------------------------------
  // RESELLER: MY LICENSES (ONLY RESELLER'S OWN LICENSES)
  // -------------------------------------------------------------
  '📜 My Licenses': `
let ownerId = 8274806813;
let queryParam = (user.telegramid == ownerId) ? "" : ("&reseller_id=eq." + user.telegramid);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?order=created_at.desc&limit=15" + queryParam + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_show_licenses_list"
});
`,

  '/on_show_licenses_list': `
var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];

if (!rows || rows.length === 0) {
  let emptyMsg = 
    "📜 <b>My Licenses List</b>\\n" +
    "━━━━━━━━━━━━━━━━━━━━━\\n" +
    "আপনার জেনারেটকৃত কোনো লাইসেন্স পাওয়া যায়নি!\\n\\n" +
    "নতুন VIP লাইসেন্স তৈরি করতে কিবোর্ড থেকে <b>\\"🔑 Generate VIP License\\"</b> বাটন ব্যবহার করুন।";
  Bot.sendMessage(emptyMsg, { parse_mode: "HTML" });
  return;
}

Bot.sendMessage("📜 <b>My Generated Licenses (" + rows.length + ")</b>\\n━━━━━━━━━━━━━━━━━━━━━", { parse_mode: "HTML" });

for (let i = 0; i < rows.length; i++) {
  let lic = rows[i];
  let statusBadge = lic.active ? "🟢 Active" : "🚫 Blocked";
  let hwidText = lic.hwid ? ("🔒 Bound: <code>" + lic.hwid + "</code>") : "🔓 Unbound";

  let msg = 
    "🔑 <b>Key:</b> <code>" + lic.key + "</code>\\n" +
    "⏱️ <b>Plan:</b> " + (lic.duration || "VIP") + "\\n" +
    "🛡️ <b>Status:</b> " + statusBadge + "\\n" +
    "📱 <b>Device:</b> " + hwidText;

  let btns = [
    [
      { text: lic.active ? "🚫 Block" : "🟢 Unblock", callback_data: (lic.active ? "/block_lic " : "/unblock_lic ") + lic.key },
      { text: "🗑️ Delete", callback_data: "/del_prompt " + lic.key }
    ]
  ];

  Api.sendMessage({ text: msg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns } });
}
`,

  '/block_lic': `
let key = (params || "").trim();
if (!key) return;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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

  '/on_block_done': `
Bot.sendMessage("🚫 <b>License Blocked Successfully!</b>\\nলাইসেন্সটি সফলভাবে ব্লক করা হয়েছে এবং ক্লায়েন্ট লগইন নিষ্ক্রিয় করা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,

  '/unblock_lic': `
let key = (params || "").trim();
if (!key) return;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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

  '/on_unblock_done': `
Bot.sendMessage("🟢 <b>License Unblocked Successfully!</b>\\nলাইসেন্সটি পুনরায় একটিভ করা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,

  '/del_prompt': `
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

  '/del_confirm': `
let key = (params || "").trim();
HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?key=eq." + key + "&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "X-HTTP-Method-Override": "DELETE"
  },
  success: "/on_del_done"
});
`,

  '/on_del_done': `
Bot.sendMessage("🗑️ <b>License Deleted!</b>\\nলাইসেন্সটি ডাটাবেজ থেকে সফলভাবে মুছে ফেলা হয়েছে।", { parse_mode: "HTML" });
Bot.runCommand("/my_licenses");
`,

  // -------------------------------------------------------------
  // RESELLER: VIP LICENSE GENERATION
  // -------------------------------------------------------------
  '🔑 Generate VIP License': `
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

  '/buy_pkg': `
let parts = (params || "").split(" ");
let days = parseInt(parts[0]) || 30;
let code = parts[1] || "30d";
let price = parseFloat(parts[2]) || 750;

User.setProperty("buying_days", days, "integer");
User.setProperty("buying_code", code, "string");
User.setProperty("buying_price", price, "float");

let ownerId = 8274806813;
let queryId = (user.telegramid == ownerId) ? "reseller:8274806813" : ("reseller:" + user.telegramid);

HTTP.get({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?id=eq." + queryId + "&select=*&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo"
  },
  success: "/on_verify_balance_buy"
});
`,

  '/on_verify_balance_buy': `
let days = User.getProperty("buying_days", 30);
let code = User.getProperty("buying_code", "30d");
let price = User.getProperty("buying_price", 750);

var raw = (typeof content !== 'undefined' && content !== null) ? content : ((typeof data !== 'undefined' && data) ? data.content : null);
var resData = null;
if (typeof raw === 'object' && raw !== null) resData = raw;
else if (typeof raw === 'string') { try { resData = JSON.parse(raw); } catch (e) {} }

var rows = Array.isArray(resData) ? resData : [];
var rData = (rows.length > 0 && rows[0].data) ? rows[0].data : Bot.getProperty("reseller_" + user.telegramid);

let currentBalance = rData ? Number(rData.balance || 0) : Number(Bot.getProperty("bal_" + user.telegramid, 0));
let rCode = rData ? (rData.reseller_code || ("TP-RSL-" + user.telegramid)) : ("TP-RSL-" + user.telegramid);

if (user.telegramid != 8274806813 && currentBalance < price) {
  Api.sendMessage({
    text: "❌ <b>Insufficient Balance!</b>\\n━━━━━━━━━━━━━━━━━━━━━\\nপ্যাকেজ মূল্য: <b>৳" + price + "</b>\\nআপনার বর্তমান ব্যালেন্স: <b>৳" + currentBalance.toFixed(2) + "</b>\\n\\nঅনুগ্রহ করে প্রথমে ব্যালেন্স ডিপোজিট করুন।",
    parse_mode: "HTML"
  });
  return;
}

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

let now = Date.now();
let durationMs = days * 86400 * 1000;

HTTP.post({
  url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_licenses?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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
    reseller_id: user.telegramid,
    created_at: now,
    expires_at: (now + durationMs),
    updated_at: now
  },
  success: "/on_license_inserted_success"
});
`,

  '/on_license_inserted_success': `
let key = User.getProperty("last_generated_key");
let newBal = User.getProperty("new_balance", 0);
let rCode = User.getProperty("reseller_code", "TP-RSL-" + user.telegramid);
let days = User.getProperty("buying_days", 30);

// Deduct balance in Supabase
if (user.telegramid != 8274806813) {
  HTTP.post({
    url: "https://qbazzarqiplrqqfytajz.supabase.co/rest/v1/ishak_bot_data?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo",
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
        reseller_code: rCode,
        balance: newBal,
        status: "active"
      },
      updated_at: Date.now()
    }
  });

  Bot.setProperty("bal_" + user.telegramid, newBal, "float");
}

let notifyReseller = 
  "🎉 <b>VIP License Generated Successfully!</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🔑 <b>Key:</b> <code>" + key + "</code>\\n" +
  "⏱️ <b>Duration:</b> " + days + " Days\\n" +
  "🛡️ <b>Tier:</b> 💎 VIP Tier\\n" +
  "💰 <b>Remaining Balance:</b> ৳" + newBal.toFixed(2) + " BDT\\n\\n" +
  "📋 <b>কাস্টমার ডেলিভারি মেসেজ (১-ক্লিকে কপি করতে নিচে ট্যাপ করুন):</b>";

let deliveryFormat = 
  "<pre>" +
  "🌟 CONGRATULATIONS! YOUR VIP LICENSE IS ACTIVE 🌟\\n" +
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
  "🔑 License Key : " + key + "\\n" +
  "⏱️ Validity    : " + days + " Days (VIP Tier)\\n" +
  "🛡️ Platform    : Quotex AI Signal Engine\\n" +
  "👤 Reseller    : " + rCode + "\\n" +
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
  "📌 নির্দেশিকা:\\n" +
  "১. ট্রেডিং সফটওয়্যারে আপনার কি টি পেস্ট করুন\\n" +
  "২. প্রথমবার লগইনে এটি আপনার ডিভাইসের সাথে বাইন্ড হবে\\n" +
  "৩. সহায়তার জন্য যোগাযোগ করুন: @trade_pilotbot\\n" +
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
  "Happy Trading & Profit with Quotex AI Bot!" +
  "</pre>";

Api.sendMessage({ text: notifyReseller, parse_mode: "HTML" });
Api.sendMessage({ text: deliveryFormat, parse_mode: "HTML" });
`,

  // -------------------------------------------------------------
  // RESELLER: DEPOSIT FLOW
  // -------------------------------------------------------------
  '💵 Deposit Request': `
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

  '/dep_step_amt': `
let method = (params || "bkash").trim();
User.setProperty("dep_method", method, "string");

Bot.runCommand("/on_dep_amt_input");
Bot.sendMessage("💰 <b>আপনি কত টাকা রিচার্জ করতে চান তা সংখ্যায় লিখে পাঠান:</b>\\n<i>(যেমন: 500 বা 1000)</i>", { parse_mode: "HTML" });
`,

  '/on_dep_amt_input': `
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

  '/on_dep_trx_input': `
let trx = (message || "").trim().toUpperCase();
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
let sender = (message || "").trim();
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

  // -------------------------------------------------------------
  // OWNER PANEL & SETTINGS
  // -------------------------------------------------------------
  '👑 Owner Admin Panel': `
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

  '⚙️ Payment Settings': `
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

  '/set_bkash_prompt': `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/save_bkash");
Bot.sendMessage("🔴 নতুন <b>bKash Personal নম্বর</b> লিখে পাঠান:", { parse_mode: "HTML" });
`,

  '/save_bkash': `
if (user.telegramid != 8274806813) return;
let num = (message || "").trim();
Bot.setProperty("bkash_num", num, "string");
Bot.sendMessage("✅ <b>bKash Personal নম্বর আপডেট সম্পন্ন:</b> <code>" + num + "</code>", { parse_mode: "HTML" });
`,

  '/set_binance_prompt': `
if (user.telegramid != 8274806813) return;
Bot.runCommand("/save_binance");
Bot.sendMessage("🟡 নতুন <b>Binance Pay ID</b> লিখে পাঠান:", { parse_mode: "HTML" });
`,

  '/save_binance': `
if (user.telegramid != 8274806813) return;
let id = (message || "").trim();
Bot.setProperty("binance_id", id, "string");
Bot.sendMessage("✅ <b>Binance Pay ID আপডেট সম্পন্ন:</b> <code>" + id + "</code>", { parse_mode: "HTML" });
`,

  '📊 Bot Statistics': `
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

  '💬 Support': `
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

  '🔄 Device Reset': `
let text = 
  "ℹ️ <b>Device Reset (HWID Unbind)</b>\\n" +
  "━━━━━━━━━━━━━━━━━━━━━\\n" +
  "আপনার কোনো লাইসেন্সে ডিভাইস বাইন্ড থাকলে <b>📜 My Licenses</b> অপশনে গিয়ে লাইসেন্সটি আনব্লক বা রিসেট করতে পারবেন।\\n\\n" +
  "কাস্টমার Quotex ট্রেডিং বটে লগইন করলেই লাইসেন্স স্বয়ংক্রিয়ভাবে বাইন্ড হয়।";

Api.sendMessage({ text: text, parse_mode: "HTML" });
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
      await new Promise((r) => setTimeout(r, 150));
    } else {
      console.log(`  ⏩ Skipping ${cmd.command} (no mapping needed)`);
    }
  }

  console.log(`\n🎉 Code sync complete! Successfully updated ${updated} commands with bulletproof BJS logic.`);
}

syncAllCode().catch(console.error);
