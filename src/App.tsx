import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  CreditCard,
  Package as PackageIcon,
  Key,
  Users,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Smartphone,
  Database,
  Terminal,
  Activity,
  ArrowUpRight,
  Plus,
  Lock,
  RotateCcw,
  Sparkles,
  Server,
  FileCode,
  Sliders,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeResellers: number;
  pendingDeposits: number;
  totalDepositVolume: number;
  totalLicenses: number;
  botStatus: string;
  officialChannel: string;
  ownerId: string;
  supportUsername: string;
}

interface PackageItem {
  id: number;
  name: string;
  duration_days: number;
  price_usd: number;
  price_bdt: number;
  is_active: boolean;
  description: string;
}

interface ResellerItem {
  id: number;
  telegram_id: number;
  reseller_code: string;
  business_name: string;
  contact_phone: string;
  balance: number;
  total_deposited: number;
  total_licenses: number;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

interface DepositItem {
  id: number;
  reseller_id: number;
  telegram_id: number;
  reseller_code: string;
  reseller_name: string;
  payment_method: string;
  amount_bdt: number;
  amount_usd: number;
  transaction_id: string;
  sender_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface LicenseItem {
  id: number;
  license_key: string;
  reseller_id: string;
  reseller_name: string;
  package_name: string;
  duration_days: number;
  status: 'unused' | 'active' | 'blocked' | 'expired';
  device_reset_count: number;
  max_device_resets: number;
  hwid: string | null;
  created_at: string;
  expires_at: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: Array<Array<{ text: string; action: string; url?: string }>>;
  time: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'admin' | 'licenses' | 'database' | 'deploy'>('simulator');
  const [stats, setStats] = useState<Stats | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [resellers, setResellers] = useState<ResellerItem[]>([]);
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New package modal state
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', duration_days: 30, price_usd: 6, price_bdt: 750, description: '' });

  // Code viewer tab
  const [selectedFile, setSelectedFile] = useState<'index.js' | 'schema.sql' | 'supabase_schema.sql' | 'supabase_bot_data.sql' | '.env.example' | 'DEPLOYMENT_GUIDE.md'>('index.js');
  const [fileContent, setFileContent] = useState<string>('');

  // Simulator State
  const [persona, setPersona] = useState<'owner' | 'reseller' | 'guest'>('reseller');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [simStep, setSimStep] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchAllData = async () => {
    try {
      const [sRes, pRes, rRes, dRes, lRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/packages'),
        fetch('/api/resellers'),
        fetch('/api/deposits'),
        fetch('/api/licenses'),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (pRes.ok) setPackages(await pRes.json());
      if (rRes.ok) setResellers(await rRes.json());
      if (dRes.ok) setDeposits(await dRes.json());
      if (lRes.ok) setLicenses(await lRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load selected file content
  useEffect(() => {
    fetch(`/api/files/${selectedFile}`)
      .then((r) => r.text())
      .then((text) => setFileContent(text))
      .catch((e) => setFileContent(`// Error loading ${selectedFile}: ${e.message}`));
  }, [selectedFile]);

  // Setup simulator initial message based on persona
  useEffect(() => {
    resetChat(persona);
  }, [persona]);

  const resetChat = (userPersona: 'owner' | 'reseller' | 'guest') => {
    setSimStep(null);
    setTempData({});
    if (userPersona === 'owner') {
      setChatMessages([
        {
          id: '1',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `👑 <b>স্বাগতম OWNER ADMIN PANEL-এ!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🛡️ <b>Ishak AI Trading Bot</b> — Reseller & License Engine\n👤 <b>Owner ID:</b> <code>8274806813</code>\n📡 <b>Channel:</b> @trade_pilotbot\n\nনিচের মেনু থেকে সম্পূর্ণ সিস্টেম নিয়ন্ত্রণ করুন:`,
          buttons: [
            [
              { text: '👥 Manage Resellers', action: 'owner_resellers' },
              { text: '💰 Deposit Requests', action: 'owner_deposits' },
            ],
            [
              { text: '📦 Package Management', action: 'owner_packages' },
              { text: '🔑 License Management', action: 'owner_licenses' },
            ],
            [
              { text: '📊 Bot Statistics', action: 'owner_stats' },
              { text: '📢 Broadcast Message', action: 'owner_broadcast' },
            ],
          ],
        },
      ]);
    } else if (userPersona === 'reseller') {
      const activeReseller = resellers.find((r) => r.status === 'active') || {
        reseller_code: 'RSL-49210',
        balance: 2500,
        total_licenses: 8,
      };
      setChatMessages([
        {
          id: '1',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `💼 <b>স্বাগতম RESELLER DASHBOARD-এ!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🏷️ <b>Reseller Code:</b> <code>${activeReseller.reseller_code}</code>\n💰 <b>বর্তমান ব্যালেন্স:</b> ৳${activeReseller.balance.toFixed(2)}\n🔑 <b>মোট জেনারেট লাইসেন্স:</b> ${activeReseller.total_licenses}\n🛡️ <b>একাউন্ট স্ট্যাটাস:</b> 🟢 Active\n\nপ্যাকেজ ক্রয়, ডিপোজিট এবং লাইসেন্স ম্যানেজমেন্টের জন্য নিচের অপশনগুলো ব্যবহার করুন:`,
          buttons: [
            [
              { text: '👤 My Profile', action: 'rsl_profile' },
              { text: '💳 My Balance', action: 'rsl_balance' },
            ],
            [
              { text: '📦 Available Packages', action: 'rsl_packages' },
              { text: '🔑 Generate License', action: 'rsl_gen_license' },
            ],
            [
              { text: '📜 My Licenses', action: 'rsl_my_licenses' },
              { text: '🔄 Device Reset Request', action: 'rsl_device_reset' },
            ],
            [
              { text: '💵 Deposit Request', action: 'rsl_deposit' },
              { text: '📊 Transaction History', action: 'rsl_tx' },
            ],
            [{ text: '💬 Support', action: 'rsl_support', url: 'https://t.me/IshakVhai' }],
          ],
        },
      ]);
    } else {
      // Guest
      setChatMessages([
        {
          id: '1',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `👋 <b>স্বাগতম Ishak AI Trading Bot রিসেলার পোর্টালে!</b>\n━━━━━━━━━━━━━━━━━━━━━\nআমাদের AI Trading Bot-এর অফিশিয়াল লাইসেন্স রিসেল করে আকর্ষণীয় মুনাফা অর্জন করুন।\n\n✨ <b>রিসেলারদের সুবিধাসমূহ:</b>\n• রিয়েলটাইম লাইসেন্স জেনারেশন (২০, ৩০, ৪৫, ৬০ দিনের প্যাকেজ)\n• নিরাপদ ম্যানুয়াল ডিপোজিট (bKash, Nagad, Rocket, USDT)\n• ডিভাইস রিসেট ও লাইসেন্স ব্লকিং পাওয়ার\n• ২৪/৭ প্রায়োরিটি সাপোর্ট\n\nরিসেলার হতে এখনই নিচের <b>"Apply for Reseller"</b> বাটনে চাপুন।`,
          buttons: [
            [{ text: '📝 Apply for Reseller / রিসেলার আবেদন', action: 'guest_apply' }],
            [{ text: '📦 View Package Pricing', action: 'guest_packages' }],
            [
              { text: '📢 Official Channel', action: 'guest_channel', url: 'https://t.me/trade_pilotbot' },
              { text: '💬 Contact Support', action: 'guest_support', url: 'https://t.me/IshakVhai' },
            ],
          ],
        },
      ]);
    }
  };

  const handleSimButton = async (action: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- OWNER ACTIONS ---
    if (action === 'owner_resellers') {
      const pending = resellers.filter((r) => r.status === 'pending');
      const active = resellers.filter((r) => r.status === 'active');
      let text = `👥 <b>রিসেলার ম্যানেজমেন্ট</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏳ পেন্ডিং আবেদন: <b>${pending.length}</b> টি\n🟢 সক্রিয় রিসেলার: <b>${active.length}</b> টি\n\n`;
      const buttons: Array<Array<{ text: string; action: string }>> = [];

      if (pending.length > 0) {
        text += `<b>পেন্ডিং আবেদনসমূহ:</b>\n`;
        pending.forEach((r) => {
          text += `• <b>${r.reseller_code}</b> | ${r.business_name} (${r.contact_phone})\n`;
          buttons.push([
            { text: `✅ Approve ${r.reseller_code}`, action: `approve_rsl_${r.id}` },
            { text: `❌ Reject`, action: `reject_rsl_${r.id}` },
          ]);
        });
      } else {
        text += `কোনো পেন্ডিং আবেদন নেই।`;
      }
      buttons.push([{ text: '🔙 Owner Menu', action: 'owner_home' }]);

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'bot', text, buttons, time },
      ]);
      return;
    }

    if (action.startsWith('approve_rsl_')) {
      const id = Number(action.replace('approve_rsl_', ''));
      await fetch(`/api/resellers/${id}/approve`, { method: 'POST' });
      fetchAllData();
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `✅ <b>রিসেলার সফলভাবে অনুমোদিত হয়েছে!</b>\nরিসেলারের টেলিগ্রামে স্বয়ংক্রিয় এক্টিভেশন নোটিফিকেশন পাঠানো হয়েছে।`,
          buttons: [[{ text: '🔙 Owner Menu', action: 'owner_home' }]],
          time,
        },
      ]);
      return;
    }

    if (action === 'owner_deposits') {
      const pending = deposits.filter((d) => d.status === 'pending');
      let text = `💰 <b>পেন্ডিং ডিপোজিট তালিকা (${pending.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
      const buttons: Array<Array<{ text: string; action: string }>> = [];

      if (pending.length === 0) {
        text += `বর্তমানে কোনো পেন্ডিং ডিপোজিট রিকোয়েস্ট নেই।`;
      } else {
        pending.forEach((d) => {
          text += `🆔 <b>#${d.id}</b> | <b>৳${d.amount_bdt}</b> (${d.payment_method})\n`;
          text += `👤 <b>Reseller:</b> ${d.reseller_code} (${d.reseller_name})\n`;
          text += `🔢 <b>TrxID:</b> <code>${d.transaction_id}</code>\n`;
          text += `📱 <b>Sender:</b> ${d.sender_number}\n\n`;
          buttons.push([
            { text: `✅ Approve #${d.id} (+৳${d.amount_bdt})`, action: `approve_dep_${d.id}` },
            { text: `❌ Reject`, action: `reject_dep_${d.id}` },
          ]);
        });
      }
      buttons.push([{ text: '🔙 Owner Menu', action: 'owner_home' }]);

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'bot', text, buttons, time },
      ]);
      return;
    }

    if (action.startsWith('approve_dep_')) {
      const id = Number(action.replace('approve_dep_', ''));
      const res = await fetch(`/api/deposits/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      fetchAllData();

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `✅ <b>Deposit #${id} অনুমোদিত হয়েছে!</b>\n💰 ব্যালেন্স যোগ হয়েছে: <b>৳${data.deposit.amount_bdt}</b>\nরিসেলার ${data.deposit.reseller_code}-এর নতুন ব্যালেন্স: <b>৳${data.reseller.balance}</b>`,
          buttons: [[{ text: '🔙 ডিপোজিট মেনু', action: 'owner_deposits' }]],
          time,
        },
      ]);
      return;
    }

    if (action === 'owner_home') {
      resetChat('owner');
      return;
    }

    // --- RESELLER ACTIONS ---
    if (action === 'rsl_home') {
      resetChat('reseller');
      return;
    }

    if (action === 'rsl_balance') {
      const reseller = resellers.find((r) => r.status === 'active') || resellers[0];
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `💳 <b>আমার ব্যালেন্স ইনফরমেশন</b>\n━━━━━━━━━━━━━━━━━━━━━\nবর্তমান ব্যালেন্স: <b>৳${reseller.balance.toFixed(2)} BDT</b> (প্রায় $${(reseller.balance / 125).toFixed(2)} USD)\nসর্বমোট ডিপোজিট: <b>৳${reseller.total_deposited.toFixed(2)}</b>\n\nলাইসেন্স ক্রয়ের জন্য পর্যাপ্ত ব্যালেন্স না থাকলে ডিপোজিট করুন:`,
          buttons: [
            [{ text: '💵 ডিপোজিট করুন', action: 'rsl_deposit' }],
            [{ text: '🔙 Dashboard', action: 'rsl_home' }],
          ],
          time,
        },
      ]);
      return;
    }

    if (action === 'rsl_packages' || action === 'guest_packages') {
      let text = `📦 <b>ISHAK AI TRADING BOT — লাইসেন্স প্যাকেজ তালিকা</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
      packages.forEach((p, idx) => {
        text += `<b>${idx + 1}. ${p.name}</b>\n`;
        text += `⏱️ মেয়াদ: <b>${p.duration_days} দিন</b>\n`;
        text += `💵 মূল্য: <b>$${p.price_usd}</b> (৳${p.price_bdt})\n`;
        text += `🔒 Device Lock: 1 Device (Max 2 Resets)\n\n`;
      });
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text,
          buttons: [[{ text: '🔙 ফিরে যান', action: persona === 'owner' ? 'owner_home' : 'rsl_home' }]],
          time,
        },
      ]);
      return;
    }

    if (action === 'rsl_gen_license') {
      const buttons = packages.map((p) => [
        { text: `⚡ ${p.name} — ৳${p.price_bdt}`, action: `gen_pkg_${p.id}` },
      ]);
      buttons.push([{ text: '🔙 Dashboard', action: 'rsl_home' }]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🔑 <b>লাইসেন্স তৈরি করতে প্যাকেজ নির্বাচন করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনির্বাচিত প্যাকেজের মূল্য আপনার ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে কর্তন হবে এবং Supabase-এ রিয়েলটাইম লাইসেন্স কি তৈরি হবে:`,
          buttons,
          time,
        },
      ]);
      return;
    }

    if (action.startsWith('gen_pkg_')) {
      const pkgId = Number(action.replace('gen_pkg_', ''));
      const activeRsl = resellers.find((r) => r.status === 'active') || resellers[0];

      const res = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkgId, reseller_id: activeRsl.id }),
      });
      const data = await res.json();
      fetchAllData();

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `❌ <b>ব্যর্থ হয়েছে!</b>\n\n${data.error}`,
            buttons: [
              [{ text: '💵 ডিপোজিট করুন', action: 'rsl_deposit' }],
              [{ text: '🔙 Dashboard', action: 'rsl_home' }],
            ],
            time,
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🎉 <b>লাইসেন্স সফলভাবে তৈরি হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🔑 <b>License Key:</b>\n<code>${data.license.license_key}</code>\n\n📦 <b>প্যাকেজ:</b> ${data.license.package_name}\n⏱️ <b>মেয়াদ:</b> ${data.license.duration_days} দিন\n💳 <b>অবশিষ্ট ব্যালেন্স:</b> ৳${data.remainingBalance.toFixed(2)}\n🔒 <b>ডিভাইস লক:</b> 1 Device (Allowed Resets: 2)\n📡 <b>Supabase Table:</b> 🟢 "ishak_licenses" Synced\n\n<i>কী-এর উপর ক্লিক করে কপি করে ট্রেডিং বট ব্যবহারকারী ক্লায়েন্টকে দিন।</i>`,
          buttons: [
            [{ text: '🔑 আরেকটি কি তৈরি করুন', action: 'rsl_gen_license' }],
            [{ text: '📜 আমার লাইসেন্স সমূহ', action: 'rsl_my_licenses' }],
            [{ text: '🔙 Dashboard', action: 'rsl_home' }],
          ],
          time,
        },
      ]);
      return;
    }

    if (action === 'rsl_my_licenses') {
      const activeRsl = resellers.find((r) => r.status === 'active') || resellers[0];
      const rslLicenses = licenses.filter((l) => l.reseller_id === activeRsl.reseller_code);

      let text = `📜 <b>আমার তৈরি করা লাইসেন্স সমূহ (${rslLicenses.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (rslLicenses.length === 0) {
        text += `আপনি এখনও কোনো লাইসেন্স তৈরি করেননি।`;
      } else {
        rslLicenses.forEach((l, idx) => {
          text += `<b>${idx + 1}.</b> <code>${l.license_key}</code>\n`;
          text += `   ⏱️ ${l.duration_days} Days | 🛡️ Status: ${l.status.toUpperCase()}\n`;
          text += `   💻 HWID: ${l.hwid ? 'Bound (PC-OK)' : 'Not Bound Yet'}\n`;
          text += `   🔄 Resets: ${l.device_reset_count}/${l.max_device_resets}\n\n`;
        });
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text,
          buttons: [
            [{ text: '🔄 ডিভাইস রিসেট করুন', action: 'rsl_device_reset' }],
            [{ text: '🔙 Dashboard', action: 'rsl_home' }],
          ],
          time,
        },
      ]);
      return;
    }

    if (action === 'rsl_device_reset') {
      const boundLicenses = licenses.filter((l) => l.hwid !== null);
      if (boundLicenses.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `ℹ️ আপনার কোনো লাইসেন্সে এই মুহূর্তে কোনো ডিভাইস আবদ্ধ (Bound) নেই। লাইসেন্স ব্যবহারকারী ট্রেডিং বটে লগইন করলেই কেবল HWID আবদ্ধ হয়।`,
            buttons: [[{ text: '🔙 Dashboard', action: 'rsl_home' }]],
            time,
          },
        ]);
        return;
      }

      const buttons = boundLicenses.map((l) => [
        { text: `🔄 Reset ${l.license_key}`, action: `reset_hwid_${l.id}` },
      ]);
      buttons.push([{ text: '🔙 Dashboard', action: 'rsl_home' }]);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🔄 <b>ডিভাইস রিসেট নির্বাচন করুন:</b>\nপ্রতি লাইসেন্সে সর্বোচ্চ ২ বার রিসেট প্রযোজ্য। যে লাইসেন্সের ডিভাইস আনবাইন্ড করতে চান তা সিলেক্ট করুন:`,
          buttons,
          time,
        },
      ]);
      return;
    }

    if (action.startsWith('reset_hwid_')) {
      const id = Number(action.replace('reset_hwid_', ''));
      const res = await fetch(`/api/licenses/${id}/reset-device`, { method: 'POST' });
      const data = await res.json();
      fetchAllData();

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `❌ <b>রিসেট ব্যর্থ:</b> ${data.error}`,
            buttons: [[{ text: '🔙 Dashboard', action: 'rsl_home' }]],
            time,
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `✅ <b>ডিভাইস সফলভাবে রিসেট সম্পন্ন হয়েছে!</b>\nলাইসেন্স <code>${data.license.license_key}</code>-এর পূর্ববর্তী HWID মুছে দেওয়া হয়েছে। ক্লায়েন্ট এখন নতুন কম্পিউটারে লগইন করতে পারবেন।`,
          buttons: [[{ text: '🔙 Dashboard', action: 'rsl_home' }]],
          time,
        },
      ]);
      return;
    }

    if (action === 'rsl_deposit') {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `💵 <b>পেমেন্ট মেথড নির্বাচন করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\nযে মাধ্যমে আপনি টাকা পাঠাতে চান তা সিলেক্ট করুন:`,
          buttons: [
            [
              { text: '🔴 bKash Personal', action: 'method_bkash' },
              { text: '🟠 Nagad Personal', action: 'method_nagad' },
            ],
            [
              { text: '🟣 Rocket Personal', action: 'method_rocket' },
              { text: '🟡 Binance Pay / USDT', action: 'method_usdt' },
            ],
            [{ text: '🔙 Dashboard', action: 'rsl_home' }],
          ],
          time,
        },
      ]);
      return;
    }

    if (action.startsWith('method_')) {
      const map: Record<string, string> = {
        method_bkash: 'bKash Personal',
        method_nagad: 'Nagad Personal',
        method_rocket: 'Rocket Personal',
        method_usdt: 'USDT TRC20 / Binance Pay',
      };
      const methodName = map[action] || 'bKash Personal';
      setTempData({ method: methodName });
      setSimStep('DEPOSIT_AMOUNT');

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `💳 <b>${methodName}</b> পেমেন্ট তথ্য:\n━━━━━━━━━━━━━━━━━━━━━\nনম্বর: <code>01812345678</code> (Personal - Send Money)\n\nটাকা পাঠানোর পর আপনি কত টাকা পাঠিয়েছেন তা ইনপুট বক্সে লিখে Send চাপুন (যেমন: 1000):`,
          time,
        },
      ]);
      return;
    }

    // Guest apply
    if (action === 'guest_apply') {
      setSimStep('APPLY_NAME');
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `📝 <b>রিসেলার আবেদন ফরম</b>\nঅনুগ্রহ করে আপনার <b>পূর্ণ নাম অথবা বিজনেস নাম</b> ইনপুট বক্সে লিখে পাঠান:`,
          time,
        },
      ]);
      return;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userText = userInput.trim();
    setUserInput('');

    // Append user message in chat
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'user', text: userText, time },
    ]);

    // Handle interactive steps
    if (simStep === 'APPLY_NAME') {
      setTempData((prev: any) => ({ ...prev, businessName: userText }));
      setSimStep('APPLY_PHONE');
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `📱 ধন্যবাদ <b>${userText}</b>! এবার আপনার <b>সচল মোবাইল / WhatsApp নম্বর</b> লিখে পাঠান:`,
            time,
          },
        ]);
      }, 500);
      return;
    }

    if (simStep === 'APPLY_PHONE') {
      const applicantName = tempData.businessName;
      const rslCode = `RSL-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create new pending reseller
      const newReseller: ResellerItem = {
        id: Date.now(),
        telegram_id: 5900000000 + Math.floor(Math.random() * 1000000),
        reseller_code: rslCode,
        business_name: applicantName,
        contact_phone: userText,
        balance: 0,
        total_deposited: 0,
        total_licenses: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setResellers((prev) => [...prev, newReseller]);
      setSimStep(null);
      setTempData({});

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ <b>আপনার রিসেলার আবেদন সফলভাবে সাবমিট হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🏷️ <b>Reseller Code:</b> <code>${rslCode}</code>\n👤 <b>নাম:</b> ${applicantName}\n📱 <b>নম্বর:</b> ${userText}\n\nঅনার (${stats?.supportUsername || '@IshakVhai'}) আবেদন ভেরিফাই করে অনুমোদন করবেন। উপরে "👑 Owner" পার্সোনা সিলেক্ট করে আপনি তাৎক্ষণিক Approve টেস্ট করতে পারেন!`,
            buttons: [[{ text: '🔄 স্ট্যাটাস দেখুন', action: 'guest_status' }]],
            time,
          },
        ]);
      }, 600);
      return;
    }

    if (simStep === 'DEPOSIT_AMOUNT') {
      const amt = parseFloat(userText);
      if (isNaN(amt) || amt <= 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `⚠️ অনুগ্রহ করে সঠিক পরিমাণ সংখ্যায় লিখুন (যেমন: 500, 1000):`,
            time,
          },
        ]);
        return;
      }
      setTempData((prev: any) => ({ ...prev, amount: amt }));
      setSimStep('DEPOSIT_TRX');
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `📝 এবার পেমেন্টের <b>Transaction ID (TrxID)</b> লিখুন (যেমন: <code>BK89230419A</code>):`,
            time,
          },
        ]);
      }, 500);
      return;
    }

    if (simStep === 'DEPOSIT_TRX') {
      const trx = userText.toUpperCase();
      const activeRsl = resellers.find((r) => r.status === 'active') || resellers[0];

      const newDeposit: DepositItem = {
        id: Math.floor(100 + Math.random() * 900),
        reseller_id: activeRsl.id,
        telegram_id: activeRsl.telegram_id,
        reseller_code: activeRsl.reseller_code,
        reseller_name: activeRsl.business_name,
        payment_method: tempData.method || 'bKash Personal',
        amount_bdt: tempData.amount || 1000,
        amount_usd: Math.round((tempData.amount || 1000) / 125),
        transaction_id: trx,
        sender_number: '01700000000',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      setDeposits((prev) => [newDeposit, ...prev]);
      setSimStep(null);
      setTempData({});

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `✅ <b>ডিপোজিট রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🆔 <b>Deposit ID:</b> #${newDeposit.id}\n💳 <b>পেমেন্ট মেথড:</b> ${newDeposit.payment_method}\n💰 <b>পরিমাণ:</b> ৳${newDeposit.amount_bdt}\n🔢 <b>TrxID:</b> <code>${newDeposit.transaction_id}</code>\n⏳ <b>স্ট্যাটাস:</b> 🟡 Pending Verification\n\nঅনার ভেরিফাই করলেই আপনার একাউন্টে ব্যালেন্স যুক্ত হবে। উপরের "👑 Owner" বাটনে ক্লিক করে আপনি নিজেই এটি এক ক্লিকে Approve করে দেখতে পারেন!`,
            buttons: [[{ text: '💳 ব্যালেন্স চেক করুন', action: 'rsl_balance' }]],
            time,
          },
        ]);
      }, 600);
      return;
    }

    // Default chat fallback
    if (userText === '/start' || userText === '/menu') {
      resetChat(persona);
      return;
    }

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `বট কমান্ডের জন্য দয়া করে মেনু বাটন ব্যবহার করুন অথবা <code>/start</code> পাঠান।`,
          buttons: [[{ text: '🔄 রিস্টার্ট /start', action: persona === 'owner' ? 'owner_home' : 'rsl_home' }]],
          time,
        },
      ]);
    }, 400);
  };

  // Add package handler
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPkg),
      });
      if (res.ok) {
        setShowPkgModal(false);
        setNewPkg({ name: '', duration_days: 30, price_usd: 6, price_bdt: 750, description: '' });
        fetchAllData();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">Ishak Telegram Reseller Bot</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">PostgreSQL + Supabase "ishak_licenses" Sync</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Telegram Simulator
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner Admin Portal
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'licenses'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Supabase Licenses
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            SQL Schemas
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'deploy'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Render Deployment
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {/* TAB 1: TELEGRAM BOT SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Info Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    টেলিগ্রাম সিমুলেটর মোড
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">Live Test</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  টেলিগ্রাম অ্যাপ ছাড়াই বটের প্রতিটি বাটন, ডিপোজিট ফরম, লাইসেন্স তৈরি এবং অ্যাডমিন অনুমোদন পরীক্ষা করুন:
                </p>

                {/* Persona selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">ব্যবহারকারী রোল নির্বাচন করুন:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPersona('owner')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex flex-col gap-1 transition-all ${
                        persona === 'owner'
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-amber-400 flex items-center gap-1">👑 Owner</span>
                      <span className="text-[10px] text-slate-400">ID: 8274806813</span>
                    </button>

                    <button
                      onClick={() => setPersona('reseller')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex flex-col gap-1 transition-all ${
                        persona === 'reseller'
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-emerald-400 flex items-center gap-1">💼 Reseller</span>
                      <span className="text-[10px] text-slate-400">Active Balance</span>
                    </button>

                    <button
                      onClick={() => setPersona('guest')}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex flex-col gap-1 transition-all ${
                        persona === 'guest'
                          ? 'border-emerald-500/80 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-cyan-400 flex items-center gap-1">👤 Guest</span>
                      <span className="text-[10px] text-slate-400">New Applicant</span>
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>অফিসিয়াল চ্যানেল:</span>
                    <a
                      href="https://t.me/trade_pilotbot"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      @trade_pilotbot
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>সাপোর্ট কন্টাক্ট:</span>
                    <span className="text-slate-200 font-mono">@IshakVhai</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Render PostgreSQL:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ready
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Supabase "ishak_licenses":</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Synced
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => resetChat(persona)}
                  className="w-full mt-4 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-medium border border-slate-700/80 flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  সিমুলেটর রিস্টার্ট করুন (/start)
                </button>
              </div>

              {/* Bot Rules & Features */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  সিস্টেমের মূল সিকিউরিটি ফিচার
                </h4>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><b>চ্যানেল মেম্বারশিপ চেক:</b> @trade_pilotbot-এ না থাকলে মূল ফিচার লক থাকবে।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><b>ডুপ্লিকেট TrxID রোধ:</b> একটি Transaction ID শুধুমাত্র একবারই ব্যবহার করা যাবে।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><b>অ্যাটমিক ব্যালেন্স আপডেট:</b> লাইসেন্স জেনারেট ও ডিপোজিটে ডাটাবেজ ট্রানজ্যাকশন লক ব্যবহৃত হয়।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><b>ডিভাইস রিসেট লিমিট:</b> প্রতি লাইসেন্সে সর্বোচ্চ ২ বার HWID রিসেট অনুমোদিত।</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Chat Frame (Telegram Phone Look) */}
            <div className="lg:col-span-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[680px] overflow-hidden">
                {/* Telegram Header */}
                <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      IB
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
                        Ishak AI Trading Bot — Reseller
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </h4>
                      <p className="text-[11px] text-slate-400">@trade_pilotbot official bot</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
                    Role: <span className="text-emerald-400 uppercase font-semibold">{persona}</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                        }`}
                      >
                        <div
                          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                          className="prose-sm"
                        />
                        <div className="text-[10px] text-right mt-1.5 opacity-60 font-mono">{msg.time}</div>
                      </div>

                      {/* Inline Keyboards */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-2 space-y-1.5 w-full max-w-[85%]">
                          {msg.buttons.map((row, rIdx) => (
                            <div key={rIdx} className="flex gap-1.5">
                              {row.map((btn, bIdx) => (
                                <button
                                  key={bIdx}
                                  onClick={() => {
                                    if (btn.url) window.open(btn.url, '_blank');
                                    else handleSimButton(btn.action);
                                  }}
                                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-xs font-medium border border-slate-700/80 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  {btn.text}
                                  {btn.url && <ExternalLink className="w-3 h-3 opacity-70" />}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-850 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      simStep ? 'প্রয়োজনীয় তথ্য লিখে Send চাপুন...' : 'মেসেজ বা কমান্ড লিখুন (যেমন: /start, 500, TrxID)...'
                    }
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition flex items-center justify-center shadow-md shadow-emerald-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OWNER ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">সক্রিয় রিসেলার</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats?.activeResellers || resellers.filter(r => r.status === 'active').length}</div>
                <div className="text-[11px] text-slate-400 mt-1">পেন্ডিং আবেদন: {resellers.filter(r => r.status === 'pending').length} টি</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">পেন্ডিং ডিপোজিট</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">{deposits.filter(d => d.status === 'pending').length}</div>
                <div className="text-[11px] text-slate-400 mt-1">যাচাইয়ের অপেক্ষায়</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">মোট ডিপোজিট ভলিউম</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">৳{stats?.totalDepositVolume || deposits.filter(d => d.status === 'approved').reduce((a, b) => a + b.amount_bdt, 0)}</div>
                <div className="text-[11px] text-slate-400 mt-1">অনুমোদিত লেনদেন</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">তৈরিকৃত লাইসেন্স</span>
                  <Key className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-cyan-400">{licenses.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">Supabase ishak_licenses</div>
              </div>
            </div>

            {/* Pending Deposits Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    ম্যানুয়াল ডিপোজিট রিকোয়েস্ট সমূহ
                  </h3>
                  <p className="text-xs text-slate-400">bKash, Nagad, Rocket ও USDT লেনদেন যাচাই ও অনুমোদন</p>
                </div>
                <button
                  onClick={fetchAllData}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> রিফ্রেশ
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-medium">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Reseller</th>
                      <th className="p-3">পদ্ধতি</th>
                      <th className="p-3">পরিমাণ (BDT)</th>
                      <th className="p-3">Transaction ID (TrxID)</th>
                      <th className="p-3">Sender</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-medium text-slate-300">#{d.id}</td>
                        <td className="p-3">
                          <div className="font-medium text-white">{d.reseller_code}</div>
                          <div className="text-[10px] text-slate-400">{d.reseller_name}</div>
                        </td>
                        <td className="p-3 text-slate-300">{d.payment_method}</td>
                        <td className="p-3 font-semibold text-emerald-400 font-mono">৳{d.amount_bdt}</td>
                        <td className="p-3 font-mono text-cyan-300 font-medium">{d.transaction_id}</td>
                        <td className="p-3 font-mono text-slate-400">{d.sender_number}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              d.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : d.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {d.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={async () => {
                                  await fetch(`/api/deposits/${d.id}/approve`, { method: 'POST' });
                                  fetchAllData();
                                }}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={async () => {
                                  await fetch(`/api/deposits/${d.id}/reject`, { method: 'POST' });
                                  fetchAllData();
                                }}
                                className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resellers Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    রিসেলার একাউন্ট ও ব্যালেন্স কন্ট্রোল
                  </h3>
                  <p className="text-xs text-slate-400">অনুমোদন, ব্যালেন্স সংযোজন এবং একাউন্ট সাসপেন্ড/এক্টিভেশন</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-medium">
                    <tr>
                      <th className="p-3">Reseller ID</th>
                      <th className="p-3">নাম ও ফোন</th>
                      <th className="p-3">Telegram ID</th>
                      <th className="p-3">বর্তমান ব্যালেন্স</th>
                      <th className="p-3">মোট ডিপোজিট</th>
                      <th className="p-3">লাইসেন্স জেনারেট</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">অ্যাডমিন অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {resellers.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-emerald-400">{r.reseller_code}</td>
                        <td className="p-3">
                          <div className="font-medium text-white">{r.business_name}</div>
                          <div className="text-[10px] text-slate-400">{r.contact_phone}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{r.telegram_id}</td>
                        <td className="p-3 font-mono font-bold text-white">৳{r.balance.toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-400">৳{r.total_deposited.toFixed(2)}</td>
                        <td className="p-3 text-cyan-400 font-semibold">{r.total_licenses} টি</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : r.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  await fetch(`/api/resellers/${r.id}/approve`, { method: 'POST' });
                                  fetchAllData();
                                }}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const amt = prompt('ব্যালেন্স অ্যাড বা মাইনাস করতে পরিমাণ লিখুন (যেমন: 500 বা -200):');
                                if (amt) {
                                  await fetch(`/api/resellers/${r.id}/adjust-balance`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ amount: amt }),
                                  });
                                  fetchAllData();
                                }
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs"
                            >
                              Add Balance
                            </button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/resellers/${r.id}/toggle-status`, { method: 'POST' });
                                fetchAllData();
                              }}
                              className={`px-2 py-1 rounded-lg text-xs border ${
                                r.status === 'active'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {r.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dynamic Packages Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-emerald-400" />
                    ডাইনামিক লাইসেন্স প্যাকেজসমূহ
                  </h3>
                  <p className="text-xs text-slate-400">মেয়াদ, USD ও BDT মূল্য নির্ধারণ</p>
                </div>
                <button
                  onClick={() => setShowPkgModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> নতুন প্যাকেজ যোগ করুন
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="p-4 bg-slate-850 border border-slate-800 rounded-xl relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{pkg.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        {pkg.duration_days} Days
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-extrabold text-white">৳{pkg.price_bdt}</span>
                      <span className="text-xs text-slate-400">(${pkg.price_usd} USD)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">{pkg.description || '1 Device Binding (Max 2 Resets)'}</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-emerald-400 text-[11px]">🟢 Active In Bot</span>
                      <button
                        onClick={async () => {
                          if (confirm(`"${pkg.name}" প্যাকেজ ডিলিট করতে চান?`)) {
                            await fetch(`/api/packages/${pkg.id}`, { method: 'DELETE' });
                            fetchAllData();
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 text-[11px] transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUPABASE LICENSES VIEW */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Supabase "ishak_licenses" টেবিল
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ishak AI Trading Bot ক্লায়েন্টদের জন্য সরাসরি Supabase থেকে রিয়েলটাইম লাইসেন্স ডাটা
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800/50">
                    Table: ishak_licenses
                  </span>
                  <button
                    onClick={fetchAllData}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-medium">
                    <tr>
                      <th className="p-3">License Key</th>
                      <th className="p-3">Reseller ID</th>
                      <th className="p-3">প্যাকেজ / মেয়াদ</th>
                      <th className="p-3">HWID (Device Binding)</th>
                      <th className="p-3">Device Resets</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3">তৈরির তারিখ</th>
                      <th className="p-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {licenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-800/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {lic.license_key}
                            </span>
                            <button
                              onClick={() => copyToClipboard(lic.license_key)}
                              className="text-slate-400 hover:text-emerald-400 transition"
                              title="Copy License Key"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{lic.reseller_id}</td>
                        <td className="p-3">
                          <div className="font-medium text-slate-200">{lic.package_name}</div>
                          <div className="text-[10px] text-slate-400">{lic.duration_days} Days</div>
                        </td>
                        <td className="p-3 font-mono">
                          {lic.hwid ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {lic.hwid}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unbound (No Device)</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {lic.device_reset_count} / {lic.max_device_resets}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              lic.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : lic.status === 'unused'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {lic.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(lic.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                await fetch(`/api/licenses/${lic.id}/reset-device`, { method: 'POST' });
                                fetchAllData();
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1"
                              title="Device Reset (Unbind HWID)"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset HWID
                            </button>
                            <button
                              onClick={async () => {
                                await fetch(`/api/licenses/${lic.id}/toggle-block`, { method: 'POST' });
                                fetchAllData();
                              }}
                              className={`px-2 py-1 rounded border text-[11px] ${
                                lic.status === 'blocked'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              {lic.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE SCHEMAS */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Render PostgreSQL Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white text-sm">1. Render PostgreSQL (Bot Data)</h3>
                  </div>
                  <button
                    onClick={() => {
                      fetch('/api/files/schema.sql')
                        .then((r) => r.text())
                        .then((t) => copyToClipboard(t));
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy SQL
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  users, resellers, deposits, transactions, packages, activity_logs, bot_settings
                </p>
                <pre className="flex-1 bg-slate-950 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-y-auto border border-slate-800/80 leading-relaxed">
                  <code>{`-- Render PostgreSQL schema for Bot data:
CREATE TABLE users (...);
CREATE TABLE resellers (...);
CREATE TABLE packages (...);
CREATE TABLE deposits (...);
CREATE TABLE transactions (...);
CREATE TABLE activity_logs (...);
CREATE TABLE bot_settings (...);`}</code>
                </pre>
              </div>

              {/* Supabase Schema Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-semibold text-white text-sm">2. Supabase "ishak_licenses" Table</h3>
                  </div>
                  <button
                    onClick={() => {
                      fetch('/api/files/supabase_schema.sql')
                        .then((r) => r.text())
                        .then((t) => copyToClipboard(t));
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy SQL
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Exclusively for Ishak AI Trading Bot license key validation & device binding
                </p>
                <pre className="flex-1 bg-slate-950 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-y-auto border border-slate-800/80 leading-relaxed">
                  <code>{`-- Supabase SQL Editor-এ রান করার স্ক্রিপ্ট:
CREATE TABLE IF NOT EXISTS ishak_licenses (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    reseller_id VARCHAR(50) NOT NULL,
    reseller_name VARCHAR(150),
    package_name VARCHAR(100),
    duration_days INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'unused',
    hwid TEXT,
    device_reset_count INTEGER DEFAULT 0,
    max_device_resets INTEGER DEFAULT 2,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RENDER DEPLOYMENT & CODE CENTER */}
        {activeTab === 'deploy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left File Switcher */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  প্রডাকশন সোর্স ফাইলসমূহ
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  GitHub-এ আপলোড ও Render-এ ডিপ্লয় করার জন্য প্রস্তুত ফাইলগুলো সরাসরি দেখুন ও কপি করুন:
                </p>

                <div className="space-y-2">
                  {[
                    { name: 'index.js', desc: 'মেইন টেলিগ্রাম বট এপ্লিকেশন (Node.js v4.0)' },
                    { name: 'supabase_bot_data.sql', desc: 'Supabase ishak_bot_data টেবিল (All Bot Data)' },
                    { name: 'supabase_schema.sql', desc: 'Supabase ishak_licenses টেবিল' },
                    { name: 'schema.sql', desc: 'Render PostgreSQL ডাটাবেজ স্ক্রিপ্ট' },
                    { name: '.env.example', desc: 'এনভায়রনমেন্ট ভেরিয়েবল টেমপ্লেট' },
                    { name: 'DEPLOYMENT_GUIDE.md', desc: 'সম্পূর্ণ ডিপ্লয়মেন্ট ম্যানুয়াল (বাংলা)' },
                  ].map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFile(f.name as any)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                        selectedFile === f.name
                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                          : 'border-slate-800 bg-slate-850 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold flex items-center justify-between">
                        {f.name}
                        {selectedFile === f.name && (
                          <span className="text-[10px] text-emerald-400 font-sans font-normal">Selected</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deployment Quick Checklist */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-xs space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Render ডিপ্লয়মেন্ট চেকলিস্ট
                </h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Render-এ PostgreSQL তৈরি করে <code>schema.sql</code> রান করুন।</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Supabase-এ <code>supabase_schema.sql</code> দিয়ে টেবিল তৈরি করুন।</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>GitHub-এ রিপোজিটরি বানিয়ে কোড পুশ করুন।</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Render Web Service-এ Start Command দিন: <code>node index.js</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>Environment Variables ইনপুট দিন এবং বট লাইভ করুন!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right File Viewer */}
            <div className="lg:col-span-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[680px] overflow-hidden">
                <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-white">{selectedFile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {copiedText && (
                      <span className="text-xs text-emerald-400 font-semibold animate-fade-in">
                        ✓ Copied to clipboard!
                      </span>
                    )}
                    <button
                      onClick={() => copyToClipboard(fileContent)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Entire File
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-950 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
                  <pre className="whitespace-pre-wrap">
                    <code>{fileContent}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Package */}
      {showPkgModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">নতুন লাইসেন্স প্যাকেজ তৈরি</h3>
              <button
                onClick={() => setShowPkgModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">প্যাকেজের নাম</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Starter Plan (20 Days)"
                  value={newPkg.name}
                  onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মেয়াদ (দিন)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPkg.duration_days}
                    onChange={(e) => setNewPkg({ ...newPkg, duration_days: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মূল্য (USD $)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newPkg.price_usd}
                    onChange={(e) => setNewPkg({ ...newPkg, price_usd: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">মূল্য (BDT ৳)</label>
                  <input
                    type="number"
                    required
                    value={newPkg.price_bdt}
                    onChange={(e) => setNewPkg({ ...newPkg, price_bdt: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">বিবরণ (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="1 Device Lock with 2 Device Resets"
                  value={newPkg.description}
                  onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
                >
                  {loading ? 'তৈরি হচ্ছে...' : 'প্যাকেজ সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
