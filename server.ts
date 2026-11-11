import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { startBotPolling, botMemory, BOT_CONFIG } from './botEngine.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Simulated / Connected state for Dashboard & Bot Simulation
interface Package {
  id: number;
  name: string;
  duration_days: number;
  price_usd: number;
  price_bdt: number;
  is_active: boolean;
  description: string;
}

interface Reseller {
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

interface Deposit {
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

interface License {
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

let packagesStore: Package[] = [
  { id: 1, name: 'Starter Plan (20 Days)', duration_days: 20, price_usd: 4.00, price_bdt: 500.00, is_active: true, description: '20 Days License Key with 1 Device Binding' },
  { id: 2, name: 'Standard Plan (30 Days)', duration_days: 30, price_usd: 6.00, price_bdt: 750.00, is_active: true, description: '30 Days License Key with 1 Device Binding' },
  { id: 3, name: 'Pro Plan (45 Days)', duration_days: 45, price_usd: 8.00, price_bdt: 1000.00, is_active: true, description: '45 Days License Key with 1 Device Binding' },
  { id: 4, name: 'Elite Plan (60 Days)', duration_days: 60, price_usd: 14.00, price_bdt: 1750.00, is_active: true, description: '60 Days License Key with 2 Device Resets Allowed' },
];

let resellersStore: Reseller[] = [
  { id: 1, telegram_id: 8274806813, reseller_code: 'RSL-OWNER', business_name: 'Ishak Master Admin', contact_phone: '+8801800000000', balance: 50000.00, total_deposited: 50000.00, total_licenses: 12, status: 'active', created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 2, telegram_id: 6192837410, reseller_code: 'RSL-49210', business_name: 'Dhaka FX Signals', contact_phone: '+8801712345678', balance: 2500.00, total_deposited: 10000.00, total_licenses: 8, status: 'active', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 3, telegram_id: 5129847120, reseller_code: 'RSL-83194', business_name: 'Chittagong Trader', contact_phone: '+8801911223344', balance: 0.00, total_deposited: 0.00, total_licenses: 0, status: 'pending', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
];

let depositsStore: Deposit[] = [
  { id: 101, reseller_id: 2, telegram_id: 6192837410, reseller_code: 'RSL-49210', reseller_name: 'Dhaka FX Signals', payment_method: 'bKash Personal', amount_bdt: 2500, amount_usd: 20, transaction_id: 'BK791823901A', sender_number: '01712345678', status: 'pending', created_at: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: 100, reseller_id: 2, telegram_id: 6192837410, reseller_code: 'RSL-49210', reseller_name: 'Dhaka FX Signals', payment_method: 'Nagad Personal', amount_bdt: 5000, amount_usd: 40, transaction_id: 'NG918204910C', sender_number: '01712345678', status: 'approved', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
];

let licensesStore: License[] = [
  { id: 1, license_key: 'ISHAK-9B7F-K4M2-99XA', reseller_id: 'RSL-49210', reseller_name: 'Dhaka FX Signals', package_name: 'Standard Plan (30 Days)', duration_days: 30, status: 'active', device_reset_count: 0, max_device_resets: 2, hwid: 'HWID-WIN-89410A7F', created_at: new Date(Date.now() - 4 * 86400000).toISOString(), expires_at: new Date(Date.now() + 26 * 86400000).toISOString() },
  { id: 2, license_key: 'ISHAK-4X88-LP19-002Q', reseller_id: 'RSL-OWNER', reseller_name: 'Ishak Master Admin', package_name: 'Elite Plan (60 Days)', duration_days: 60, status: 'unused', device_reset_count: 0, max_device_resets: 2, hwid: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString(), expires_at: new Date(Date.now() + 59 * 86400000).toISOString() },
];

let activityLogs: Array<{ id: number; action: string; user: string; details: string; timestamp: string }> = [
  { id: 1, action: 'SYSTEM_BOOT', user: 'System', details: 'Ishak Reseller Management Engine started', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 2, action: 'DEPOSIT_SUBMIT', user: 'RSL-49210', details: 'Submitted ৳2500 via bKash (Trx: BK791823901A)', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
];

// Optional live connections
let livePgPool: Pool | null = null;
let liveSupabaseClient: any = null;

if (process.env.DATABASE_URL) {
  try {
    livePgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  } catch (e) {
    console.warn('Live PG init skipped:', e);
  }
}

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    liveSupabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (e) {
    console.warn('Live Supabase init skipped:', e);
  }
}

// ---------------- API ROUTES ----------------

// System Overview & Stats
app.get('/api/stats', (req, res) => {
  const totalUsers = resellersStore.length + 15;
  const activeResellers = resellersStore.filter(r => r.status === 'active').length;
  const pendingDeposits = depositsStore.filter(d => d.status === 'pending').length;
  const totalDepositVolume = depositsStore.filter(d => d.status === 'approved').reduce((acc, d) => acc + d.amount_bdt, 0);
  const totalLicenses = licensesStore.length;

  res.json({
    totalUsers,
    activeResellers,
    pendingDeposits,
    totalDepositVolume,
    totalLicenses,
    botStatus: 'online',
    officialChannel: '@trade_pilotbot',
    ownerId: '8274806813',
    supportUsername: '@IshakVhai',
    hasPgUrl: Boolean(process.env.DATABASE_URL),
    hasSupabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

// Packages Management
app.get('/api/packages', (req, res) => {
  res.json(packagesStore);
});

app.post('/api/packages', (req, res) => {
  const { name, duration_days, price_usd, price_bdt, description } = req.body;
  const newPkg: Package = {
    id: packagesStore.length > 0 ? Math.max(...packagesStore.map(p => p.id)) + 1 : 1,
    name: name || 'New Package',
    duration_days: Number(duration_days) || 30,
    price_usd: Number(price_usd) || 5.0,
    price_bdt: Number(price_bdt) || 600,
    is_active: true,
    description: description || '',
  };
  packagesStore.push(newPkg);
  activityLogs.unshift({
    id: Date.now(),
    action: 'PACKAGE_CREATE',
    user: 'Owner',
    details: `Created package "${newPkg.name}" ($${newPkg.price_usd} / ৳${newPkg.price_bdt})`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, package: newPkg });
});

app.put('/api/packages/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = packagesStore.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Package not found' });
  
  packagesStore[idx] = { ...packagesStore[idx], ...req.body };
  res.json({ success: true, package: packagesStore[idx] });
});

app.delete('/api/packages/:id', (req, res) => {
  const id = Number(req.params.id);
  packagesStore = packagesStore.filter(p => p.id !== id);
  res.json({ success: true });
});

// Reseller Management
app.get('/api/resellers', (req, res) => {
  res.json(resellersStore);
});

app.post('/api/resellers/:id/approve', (req, res) => {
  const id = Number(req.params.id);
  const reseller = resellersStore.find(r => r.id === id);
  if (!reseller) return res.status(404).json({ error: 'Reseller not found' });
  
  reseller.status = 'active';
  activityLogs.unshift({
    id: Date.now(),
    action: 'RESELLER_APPROVED',
    user: 'Owner',
    details: `Approved reseller ${reseller.reseller_code} (${reseller.business_name})`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, reseller });
});

app.post('/api/resellers/:id/toggle-status', (req, res) => {
  const id = Number(req.params.id);
  const reseller = resellersStore.find(r => r.id === id);
  if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

  reseller.status = reseller.status === 'active' ? 'suspended' : 'active';
  activityLogs.unshift({
    id: Date.now(),
    action: 'RESELLER_STATUS_CHANGE',
    user: 'Owner',
    details: `Set status of ${reseller.reseller_code} to ${reseller.status}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, reseller });
});

app.post('/api/resellers/:id/adjust-balance', (req, res) => {
  const id = Number(req.params.id);
  const { amount, note } = req.body;
  const reseller = resellersStore.find(r => r.id === id);
  if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

  const numAmount = Number(amount);
  if (isNaN(numAmount)) return res.status(400).json({ error: 'Invalid amount' });

  reseller.balance = Math.max(0, reseller.balance + numAmount);
  activityLogs.unshift({
    id: Date.now(),
    action: 'BALANCE_ADJUST',
    user: 'Owner',
    details: `Adjusted balance of ${reseller.reseller_code} by ৳${numAmount}. Note: ${note || 'Admin adjustment'}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, reseller });
});

// Deposits Management
app.get('/api/deposits', (req, res) => {
  res.json(depositsStore);
});

app.post('/api/deposits/:id/approve', (req, res) => {
  const id = Number(req.params.id);
  const deposit = depositsStore.find(d => d.id === id);
  if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
  if (deposit.status !== 'pending') return res.status(400).json({ error: 'Deposit already processed' });

  deposit.status = 'approved';
  const reseller = resellersStore.find(r => r.id === deposit.reseller_id);
  if (reseller) {
    reseller.balance += deposit.amount_bdt;
    reseller.total_deposited += deposit.amount_bdt;
  }

  activityLogs.unshift({
    id: Date.now(),
    action: 'DEPOSIT_APPROVED',
    user: 'Owner',
    details: `Approved Deposit #${deposit.id} (৳${deposit.amount_bdt}) for ${deposit.reseller_code}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, deposit, reseller });
});

app.post('/api/deposits/:id/reject', (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const deposit = depositsStore.find(d => d.id === id);
  if (!deposit) return res.status(404).json({ error: 'Deposit not found' });

  deposit.status = 'rejected';
  activityLogs.unshift({
    id: Date.now(),
    action: 'DEPOSIT_REJECTED',
    user: 'Owner',
    details: `Rejected Deposit #${deposit.id}. Reason: ${reason || 'Invalid TrxID'}`,
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, deposit });
});

// Licenses Management (Supabase ishak_licenses)
app.get('/api/licenses', (req, res) => {
  res.json(licensesStore);
});

app.post('/api/licenses/generate', (req, res) => {
  const { package_id, reseller_id } = req.body;
  const pkg = packagesStore.find(p => p.id === Number(package_id));
  const reseller = resellersStore.find(r => r.id === Number(reseller_id));

  if (!pkg) return res.status(400).json({ error: 'Invalid package' });
  if (!reseller) return res.status(400).json({ error: 'Invalid reseller' });

  if (reseller.balance < pkg.price_bdt) {
    return res.status(400).json({ error: `Insufficient balance! Cost is ৳${pkg.price_bdt}, available balance is ৳${reseller.balance}` });
  }

  // Atomic deduction
  reseller.balance -= pkg.price_bdt;
  reseller.total_licenses += 1;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (l: number) => Array.from({ length: l }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const licenseKey = `ISHAK-${seg(4)}-${seg(4)}-${seg(4)}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + pkg.duration_days * 86400000);

  const newLicense: License = {
    id: licensesStore.length > 0 ? Math.max(...licensesStore.map(l => l.id)) + 1 : 1,
    license_key: licenseKey,
    reseller_id: reseller.reseller_code,
    reseller_name: reseller.business_name,
    package_name: pkg.name,
    duration_days: pkg.duration_days,
    status: 'unused',
    device_reset_count: 0,
    max_device_resets: 2,
    hwid: null,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  licensesStore.unshift(newLicense);

  activityLogs.unshift({
    id: Date.now(),
    action: 'LICENSE_GENERATED',
    user: reseller.reseller_code,
    details: `Generated ${pkg.duration_days} Days key: ${licenseKey}`,
    timestamp: now.toISOString(),
  });

  res.json({ success: true, license: newLicense, remainingBalance: reseller.balance });
});

app.post('/api/licenses/:id/reset-device', (req, res) => {
  const id = Number(req.params.id);
  const license = licensesStore.find(l => l.id === id);
  if (!license) return res.status(404).json({ error: 'License not found' });

  if (license.device_reset_count >= license.max_device_resets) {
    return res.status(400).json({ error: `Maximum reset limit (${license.max_device_resets}) reached!` });
  }

  license.hwid = null;
  license.device_reset_count += 1;

  activityLogs.unshift({
    id: Date.now(),
    action: 'DEVICE_RESET',
    user: license.reseller_id,
    details: `Reset HWID binding for ${license.license_key} (${license.device_reset_count}/${license.max_device_resets})`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, license });
});

app.post('/api/licenses/:id/toggle-block', (req, res) => {
  const id = Number(req.params.id);
  const license = licensesStore.find(l => l.id === id);
  if (!license) return res.status(404).json({ error: 'License not found' });

  license.status = license.status === 'blocked' ? 'active' : 'blocked';
  activityLogs.unshift({
    id: Date.now(),
    action: 'LICENSE_STATUS_CHANGE',
    user: 'Admin/Reseller',
    details: `Set status of ${license.license_key} to ${license.status}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, license });
});

// Activity logs
app.get('/api/logs', (req, res) => {
  res.json(activityLogs);
});

// File reader endpoint for 1-click preview and download
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const allowed = ['index.js', 'schema.sql', 'supabase_schema.sql', 'supabase_bot_data.sql', '.env.example', 'DEPLOYMENT_GUIDE.md', 'package.json'];
  if (!allowed.includes(filename)) return res.status(403).json({ error: 'Access denied' });

  const filePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(fs.readFileSync(filePath, 'utf-8'));
  } else {
    res.status(404).send('File not found');
  }
});

// ---------------- VITE MIDDLEWARE / STATIC FILES ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Ishak Reseller Bot Web Studio running at http://localhost:${PORT}`);
    // Start Live Telegram Bot Polling Engine
    startBotPolling();
  });
}

startServer();
