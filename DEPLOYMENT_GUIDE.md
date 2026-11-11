# 🚀 TradePilot Telegram Reseller Management Bot (v4.0)
## Supabase Unified Data Storage & GitHub / Render Deployment Manual

এই প্রজেক্টটি একটি একক ফাইল **`index.js`**-এর মাধ্যমে সরাসরি Render-এ Web Service হিসেবে হোস্ট করার জন্য সম্পূর্ণ প্রস্তুত।
সমস্ত রিসেলার একাউন্ট, ব্যালেন্স, ডিপোজিট রিকোয়েস্ট ও সেটিংস Supabase-এর একক টেবিল **`ishak_bot_data`**-তে সংরক্ষিত থাকে।

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
- **Supabase License Table:** `ishak_licenses` (Tier: **VIP**, Format: `TP-VIP-XXXX-XXXX-XXXX-XXXX`)
- **Supabase Bot Data Table:** `ishak_bot_data` (All Resellers, Balances, Deposits, Settings)

---

### 🗄️ Supabase-এ `ishak_bot_data` টেবিল তৈরির SQL স্ক্রিপ্ট:
নিচের কোডটি কপি করে আপনার [Supabase Dashboard](https://supabase.com/dashboard)-এ গিয়ে **SQL Editor**-এ পেস্ট করে **Run** করুন:

```sql
-- Create Unified Bot Data Table
CREATE TABLE IF NOT EXISTS public.ishak_bot_data (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                         -- 'reseller', 'deposit', 'settings'
    telegram_id BIGINT,                         -- Telegram Chat/User ID
    data JSONB NOT NULL DEFAULT '{}'::jsonb,    -- Complete Data Payload
    created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_ishak_bot_data_type ON public.ishak_bot_data (type);
CREATE INDEX IF NOT EXISTS idx_ishak_bot_data_tgid ON public.ishak_bot_data (telegram_id);

-- Enable RLS and public access for Bot Anon Key
ALTER TABLE public.ishak_bot_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all access on ishak_bot_data" ON public.ishak_bot_data;
CREATE POLICY "Allow public all access on ishak_bot_data"
ON public.ishak_bot_data FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed Initial Owner Reseller
INSERT INTO public.ishak_bot_data (id, type, telegram_id, data)
VALUES (
    'reseller:8274806813',
    'reseller',
    8274806813,
    '{"id": 1, "telegram_id": 8274806813, "username": "IshakVhai", "reseller_code": "TP-RSL-OWNER", "business_name": "Ishak Master Admin", "balance": 100000.0, "total_deposited": 100000.0, "total_licenses": 10, "status": "active"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Seed Initial Payment Settings
INSERT INTO public.ishak_bot_data (id, type, telegram_id, data)
VALUES (
    'settings:payment',
    'settings',
    8274806813,
    '{"bkash": "01606398924", "binancePayId": "827480681"}'::jsonb
) ON CONFLICT (id) DO NOTHING;
```

---

### 🛡️ সর্বশেষ আপডেটেড ফিচারসমূহ (v4.0):
1. **সুপাবেজ অল-ইন-ওয়ান পারসিস্টেন্স (`ishak_bot_data`):**
   - সার্ভার রিস্টার্ট বা রেন্ডার রিডিপ্লয় হলেও কোনো রিসেলার, ব্যালেন্স, ডিপোজিট ট্রানজেকশন বা সেটিংস মুছে যাবে না।
2. **লাইসেন্স ব্লক, আনব্লক ও ডিলিট লাইভ অপশন:**
   - ওনার ও রিসেলার `📜 My Licenses` এবং `🔑 License Manager`-এ গেলে সরাসরি প্রতিটি লাইসেন্সের পাশে **[ 🚫 Block ]** / **[ 🟢 Unblock ]** এবং **[ 🗑️ Delete ]** বাটন পাবেন।
   - যেকোনো লাইসেন্স Key সার্চ করে তাৎক্ষণিক স্ট্যাটাস কার্ড দেখা ও অ্যাকশন নেওয়া যাবে।
3. **ডিপোজিট রিজেকশন ইনস্ট্যান্ট নোটিফিকেশন:**
   - এডমিন ডিপোজিট রিকোয়েস্ট রিজেক্ট (`❌ Reject`) করার সাথে সাথে রিসেলারের টেলিগ্রামে বিস্তারিত কারণসহ ইনস্ট্যান্ট নোটিফিকেশন যাবে এবং সরাসরি এডমিনের সাথে যোগাযোগের বাটন থাকবে।
4. **১-ট্যাপ সম্পূর্ণ ডেলিভারি কপি ফরম্যাট:**
   - লাইসেন্স জেনারেট শেষে পুরো ডেলিভারি মেসেজটি আলাদা `<pre>` কোডব্লকে সংরক্ষিত থাকে।
5. **লাইভ প্রোগ্রেস লোডিং ইন্টারফেস:**
   - লাইসেন্স তৈরির সময় রিয়েলটাইম লোডিং বার (`12% -> 38% -> 68% -> 92% -> 100%`) প্রদর্শিত হয়।
6. **প্রথম মেসেজে Chat ID প্রদর্শন:**
   - ইউজার প্রথম `/start` করলেই তার Chat ID স্পষ্ট কোড আকারে প্রদর্শিত হয়।

---

### 📦 GitHub-এ আপলোড ও Render অটো-আপডেট:
```bash
git add index.js package.json supabase_bot_data.sql DEPLOYMENT_GUIDE.md
git commit -m "Update TradePilot Reseller Bot v4.0 (Supabase ishak_bot_data, Block/Delete, Deposit Reject Notification)"
git push origin main
```
Render-এ Auto-Deploy চালু থাকলে কোড পুশ করার সাথে সাথে নতুন ফিচারগুলো কার্যকর হয়ে যাবে!
