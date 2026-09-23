import { useState } from 'react';
import type { StoreSettings, Cashier } from '../types/pos';
import {
  Database,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Save,
  Store,
  Receipt,
  Coins,
  User,
  Copy,
  Check,
  ArrowLeft,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface SettingsPageProps {
  apiUrl: string;
  onSaveApiUrl: (url: string) => void;
  onResetToEnvUrl: () => void;
  onTestConnection: (url: string) => Promise<{ success: boolean; count?: number; error?: string; latencyMs?: number }>;
  storeSettings: StoreSettings;
  onSaveStoreSettings: (settings: StoreSettings) => void;
  onBackToRegister: () => void;
  cashiers?: Cashier[];
}


const COMMON_CURRENCIES = [
  { symbol: '₱', label: 'PHP (₱)' },
  { symbol: '$', label: 'USD ($)' },
  { symbol: '€', label: 'EUR (€)' },
  { symbol: '£', label: 'GBP (£)' },
  { symbol: '¥', label: 'JPY/CNY (¥)' },
  { symbol: 'RM', label: 'MYR (RM)' },
  { symbol: '₹', label: 'INR (₹)' },
];

export default function SettingsPage({
  apiUrl,
  onSaveApiUrl,
  onResetToEnvUrl,
  onTestConnection,
  storeSettings,
  onSaveStoreSettings,
  onBackToRegister,
  cashiers = []
}: SettingsPageProps) {

  // Connection Form State
  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    count?: number;
    error?: string;
    latencyMs?: number;
  } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Store Profile State
  const [profile, setProfile] = useState<StoreSettings>(storeSettings);
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Guide accordion state
  const [showGuide, setShowGuide] = useState(true);
  const [showCustomTemplateInput, setShowCustomTemplateInput] = useState(false);
  const [customTemplateUrl, setCustomTemplateUrl] = useState(
    storeSettings.templateSheetUrl || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy'
  );

  // Handle URL Save
  const handleSaveUrl = () => {
    onSaveApiUrl(inputUrl.trim());
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Handle URL Test
  const handleRunTest = async () => {
    if (!inputUrl.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(inputUrl.trim());
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setTestResult({ success: false, error: msg });
    } finally {
      setTestLoading(false);
    }
  };

  // Handle Copy to Clipboard
  const handleCopyUrl = async () => {
    if (!inputUrl) return;
    try {
      await navigator.clipboard.writeText(inputUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handle Store Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStoreSettings({
      ...profile,
      templateSheetUrl: customTemplateUrl.trim()
    });
    setProfileSavedNotice(true);
    setTimeout(() => setProfileSavedNotice(false), 3000);
  };

  const isConnected = !!apiUrl && !apiUrl.includes('YOUR_SCRIPT_ID');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Top Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <button
            onClick={onBackToRegister}
            className="group flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Register</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isConnected ? 'Sheets API Connected' : 'Setup Required'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your Google Sheets database connection, store profile, and terminal configurations.
          </p>
        </div>

        <button
          onClick={onBackToRegister}
          className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700"
        >
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>Open POS Register</span>
        </button>
      </div>

      {/* SECTION 1: GOOGLE SHEETS CONNECTION (BYOS HUB) */}
      <section className="bg-[#0E1223] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Section Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Google Sheets Database (BYOS)
              </h2>
              <p className="text-xs text-slate-400">
                Connect directly to your private Google Sheet without any middleman servers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <span>{showGuide ? 'Hide Guide' : 'Show Setup Guide'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 1-Click BYOS Template Callout Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Step 1: Get Your Free Database
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Make a Copy of the Official Google Sheet Template
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Clicking the button will open Google Drive and create a private copy with the 3 required tabs
                (<strong className="text-emerald-300">Products</strong>, <strong className="text-cyan-300">Sales</strong>, <strong className="text-amber-300">SaleItems</strong>)
                and the Apps Script API code already attached.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
              <a
                href={customTemplateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Make a Copy in Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={() => setShowCustomTemplateInput(!showCustomTemplateInput)}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <span>Edit Link</span>
              </button>
            </div>
          </div>

          {/* Optional: Customize Template URL */}
          {showCustomTemplateInput && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">
                Custom Template Sheet URL (Must end with <code>/copy</code>):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTemplateUrl}
                  onChange={(e) => setCustomTemplateUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/copy"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomTemplateInput(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Step-by-Step Guide */}
        {showGuide && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Quick 2-Minute Deployment Steps
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-white">Copy Template</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Click the green button above to duplicate the template sheet into your personal Google Drive.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-white">Open Apps Script</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Inside your new sheet, click <strong>Extensions ➔ Apps Script</strong> in the top menu.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px] flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-white">Deploy as Web App</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Click <strong>Deploy ➔ New deployment</strong>. Select <em>Web app</em>, set <em>Execute as: Me</em>, and <em>Who has access: Anyone</em>.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[11px] flex items-center justify-center">
                  4
                </div>
                <div className="font-bold text-white">Paste URL Below</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Copy the generated Web App URL (`.../exec`), paste it into the field below, and click <strong>Save & Connect</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Web App URL Form */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-200">
              Google Apps Script Web App URL <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onResetToEnvUrl}
                className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to .env.local</span>
              </button>
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setInputUrl('')}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-24 py-3 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyUrl}
                disabled={!inputUrl}
                title="Copy URL"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons: Test Connection & Save */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleRunTest}
              disabled={testLoading || !inputUrl.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
              <span>{testLoading ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveUrl}
              disabled={!inputUrl.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>

            {saveSuccessNotice && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>URL saved successfully!</span>
              </span>
            )}
          </div>

          {/* Connection Test Diagnostics Result Banner */}
          {testResult && (
            <div className={`mt-3 p-4 rounded-xl border text-xs flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold">
                  {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </div>
                {testResult.success ? (
                  <p className="text-slate-300">
                    Successfully reached Google Apps Script. 
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono text-emerald-400 font-bold ml-1">
                        Latency: {testResult.latencyMs}ms.
                      </span>
                    )}
                    {testResult.count !== undefined && (
                      <span className="ml-1">
                        Found <strong className="text-white">{testResult.count}</strong> active products in the sheet.
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-rose-300 leading-relaxed">
                    <strong>Error:</strong> {testResult.error || 'Unable to connect to Google Apps Script.'}
                    <br />
                    <span className="text-slate-400 text-[11px] block mt-1">
                      Tip: Ensure you deployed the script as a <strong>Web App</strong> with <strong>Who has access: Anyone</strong>.
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      </section>

      {/* SECTION 2: STORE PROFILE & TERMINAL SETTINGS */}
      <section className="bg-[#0E1223] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Store & Terminal Profile</h2>
            <p className="text-xs text-slate-400">
              Customize your store identity, currency symbol, and printed receipt information.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Store Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Name</span>
              </label>
              <input
                type="text"
                value={profile.storeName}
                onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                placeholder="e.g. My Cafe & Grocery"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-500">Displayed on the top header and receipts.</p>
            </div>

            {/* Default Cashier */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default Cashier Name</span>
                </span>
                {cashiers.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono font-normal">
                    {cashiers.length} detected from Sheets
                  </span>
                )}
              </label>
              {cashiers.length > 0 ? (
                <select
                  value={profile.cashierName}
                  onChange={(e) => setProfile({ ...profile, cashierName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.nickname} className="bg-slate-900 text-slate-100">
                      {c.nickname} ({c.fullName})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={profile.cashierName}
                  onChange={(e) => setProfile({ ...profile, cashierName: e.target.value })}
                  placeholder="e.g. Carlo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              )}
              <p className="text-[11px] text-slate-500">Default cashier recorded on sales transactions.</p>
            </div>

            {/* Currency Symbol */}
            <div className="space-y-2 md:col-span-2">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Currency Symbol</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COMMON_CURRENCIES.map((curr) => (
                  <button
                    key={curr.symbol}
                    type="button"
                    onClick={() => setProfile({ ...profile, currencySymbol: curr.symbol })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      profile.currencySymbol === curr.symbol
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {curr.label}
                  </button>
                ))}
                <input
                  type="text"
                  value={profile.currencySymbol}
                  onChange={(e) => setProfile({ ...profile, currencySymbol: e.target.value })}
                  placeholder="Custom"
                  className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">Used for price badges, cart subtotals, and receipt printing.</p>
            </div>

            {/* Receipt Footer Message */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Receipt Footer Message</span>
              </label>
              <input
                type="text"
                value={profile.receiptFooter}
                onChange={(e) => setProfile({ ...profile, receiptFooter: e.target.value })}
                placeholder="e.g. Thank you for your business! Please come again."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Store Profile</span>
            </button>

            {profileSavedNotice && (
              <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Store profile updated!</span>
              </span>
            )}
          </div>

        </form>
      </section>

      {/* SECTION 3: GOOGLE SHEET DATABASE SCHEMA REFERENCE */}
      <section className="bg-[#0E1223] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Google Sheet Database Structure (4 Sheets)</span>
        </h3>
        <p className="text-xs text-slate-400">
          Your Google Sheet can contain these 4 tabs. Column headers must match exactly:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Products Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">1. Products</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">Catalog</span>
            </div>
            <p className="text-slate-400 text-[11px]">Primary product inventory</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <ul className="text-slate-300 space-y-1 font-mono text-[11px]">
                <li><strong className="text-white">id</strong>: &quot;P001&quot;</li>
                <li><strong className="text-white">name</strong>: &quot;Coke&quot;</li>
                <li><strong className="text-white">price</strong>: 25</li>
                <li><strong className="text-white">stock</strong>: 50</li>
                <li><strong className="text-white">category</strong>: &quot;Drinks&quot;</li>
                <li><strong className="text-white">active</strong>: TRUE</li>
              </ul>
            </div>
          </div>

          {/* Sales Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">2. Sales</span>
              <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-mono">Ledger</span>
            </div>
            <p className="text-slate-400 text-[11px]">Completed transactions</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <ul className="text-slate-300 space-y-1 font-mono text-[11px]">
                <li><strong className="text-white">sale_id</strong>: &quot;S000001&quot;</li>
                <li><strong className="text-white">date</strong>: ISO Timestamp</li>
                <li><strong className="text-white">cashier</strong>: &quot;Carlo&quot;</li>
                <li><strong className="text-white">subtotal, discount</strong></li>
                <li><strong className="text-white">total, payment, change</strong></li>
              </ul>
            </div>
          </div>

          {/* SaleItems Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">3. SaleItems</span>
              <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono">Lines</span>
            </div>
            <p className="text-slate-400 text-[11px]">Line items per sale</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <ul className="text-slate-300 space-y-1 font-mono text-[11px]">
                <li><strong className="text-white">sale_id</strong>: &quot;S000001&quot;</li>
                <li><strong className="text-white">product_id</strong>: &quot;P002&quot;</li>
                <li><strong className="text-white">product_name</strong>: &quot;Burger&quot;</li>
                <li><strong className="text-white">quantity</strong>: 2</li>
                <li><strong className="text-white">price, subtotal</strong></li>
              </ul>
            </div>
          </div>

          {/* Cashiers Sheet */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400">4. Cashiers</span>
              <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-mono">Staff</span>
            </div>
            <p className="text-slate-400 text-[11px]">Authorized cashiers & nicknames</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              <ul className="text-slate-300 space-y-1 font-mono text-[11px]">
                <li><strong className="text-white">id</strong>: &quot;C001&quot;</li>
                <li><strong className="text-white">fullName</strong>: &quot;Carlo Dandan&quot;</li>
                <li><strong className="text-white">nickname</strong>: &quot;Carlo&quot;</li>
                <li><strong className="text-white">active</strong>: TRUE</li>
              </ul>
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 4: DIAGNOSTICS & RESET */}
      <section className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Reset Local Terminal Data</h3>
          <p className="text-xs text-slate-400">
            Clears locally cached API URLs and restores default settings without affecting your Google Sheet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset local configuration to defaults? This will clear stored API URL in localStorage.')) {
              onResetToEnvUrl();
              setInputUrl('');
            }
          }}
          className="bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Configuration</span>
        </button>
      </section>

    </div>
  );
}
