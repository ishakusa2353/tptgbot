# 🚀 TradePilot Telegram Reseller Management Bot — Deployment Guide
## GitHub Upload & Render Web Service Deployment Manual

এই প্রজেক্টটি একটি একক ফাইল **`index.js`**-এর মাধ্যমে সরাসরি Render-এ Web Service হিসেবে হোস্ট করার জন্য সম্পূর্ণ প্রস্তুত।

---

### 📌 মূল কনফিগারেশন ও আইডেন্টিটি:
- **বটের ইউজারনেম:** `@trade_pilotrobot`
- **বট টোকেন:** `9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ`
- **অনার টেলিগ্রাম আইডি:** `8274806813`
- **অফিসিয়াল চ্যানেল:** `@trade_pilotbot`
- **সাপোর্ট:** `@IshakVhai`
- **bKash Personal:** `01606398924`
- **Binance Pay ID:** `827480681` (এডমিন প্যানেল থেকে পরিবর্তনযোগ্য)
- **Supabase URL:** `https://qbazzarqiplrqqfytajz.supabase.co`
- **Supabase Table:** `ishak_licenses` (Tier: **VIP**, Format: `TP-VIP-XXXX-XXXX-XXXX-XXXX`)

---

### 🛡️ নিরাপত্তা ও রেস্ট্রিকশন লজিক:
1. **চ্যানেল মেম্বারশিপ চেক:** ইউজার `@trade_pilotbot` চ্যানেলে জয়েন না থাকলে কোনো কার্যক্রম শুরু হবে না।
2. **নন-রিসেলার ব্লকিং (Access Denied):**
   - কোনো সাধারণ ইউজার বটে ঢুকলে প্যাকেজ বা ডিপোজিট অপশন দেখবে না।
   - শুধুমাত্র বার্তা আসবে: *"এক্সেস ডেইনেড! আপনি রিসেলার নন! রিসেলারের আবেদন করুন"* এবং নিচে `@IshakVhai`-এর ইনবক্স বাটন থাকবে।
3. **ম্যানুয়াল রিসেলার যুক্তকরণ:**
   - বটের ভেতর কোনো ইউজার নিজে নিজে রিসেলার হওয়ার ফর্ম পাবে না।
   - শুধুমাত্র অনার অ্যাডমিন প্যানেলের **"➕ Add Reseller Manually"** অপশন থেকে ইউজার আইডি ও প্রারম্ভিক ব্যালেন্স দিয়ে নতুন রিসেলার অ্যাড করবেন।
4. **পেমেন্ট মেথড:**
   - শুধুমাত্র **bKash Personal** (`01606398924`) এবং **Binance Pay / USDT** থাকবে।
5. **ডুয়েল কিবোর্ড:**
   - মেসেজের নিচে ইনলাইন বাটন ছাড়াও স্ক্রিনের নিচে পারসিস্টেন্ট কীবোর্ড মেনু থাকবে।

---

### 📦 GitHub-এ আপলোড করার নিয়ম:
```bash
git init
git add index.js package.json .env.example DEPLOYMENT_GUIDE.md
git commit -m "TradePilot Telegram Reseller Bot v3.0 (Single-file Render Ready)"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/tradepilot-reseller-bot.git
git push -u origin main
```

---

### 🌐 Render-এ Deploy করার ধাপসমূহ:

১. [Render Dashboard](https://dashboard.render.com/)-এ লগইন করুন।
২. **New +** -> **Web Service** নির্বাচন করুন।
৩. আপনার GitHub রিপোজিটরি কানেক্ট করুন।
৪. সেটিংস কনফিগার করুন:
   - **Name:** `tradepilot-reseller-bot`
   - **Region:** Singapore / Oregon / Frankfurt
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`

৫. **Environment Variables** যোগ করুন:
   - `TELEGRAM_BOT_TOKEN`: `9048181016:AAGNZsnyoU-0IUff4OG3Ezb1ncGbmBER0pQ`
   - `OWNER_TELEGRAM_ID`: `8274806813`
   - `OFFICIAL_CHANNEL`: `@trade_pilotbot`
   - `SUPPORT_USERNAME`: `@IshakVhai`
   - `BKASH_NUMBER`: `01606398924`
   - `BINANCE_PAY_ID`: `827480681`
   - `SUPABASE_URL`: `https://qbazzarqiplrqqfytajz.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYXp6YXJxaXBscnFxZnl0YWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDc4NDUsImV4cCI6MjEwNDMyMzg0NX0.7BPbYW6P50Nh3OrkQU_T1GOwib-iKNUhLFoc1GxiNZo`

৬. **Create Web Service** বাটনে চাপুন। Render সার্ভার বিল্ড করে `index.js` ফাইলটি স্বয়ংক্রিয়ভাবে লাইভ রাখবে!
