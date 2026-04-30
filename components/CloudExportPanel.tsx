'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  X, Cloud, LayoutTemplate, Plug2, CalendarClock, History,
  Loader2, CheckCircle2, Copy, Check, Share2, RefreshCw,
  Trash2, Wifi, WifiOff, Send, Zap, ChevronRight,
} from 'lucide-react';
import { Expense } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
  EXPORT_TEMPLATES, CLOUD_DESTINATIONS,
  ExportHistoryItem, ExportSchedule,
  loadHistory, pushHistory, clearHistory,
  loadConnections, saveConnections,
  loadSchedule, saveSchedule, describeSchedule,
  generateShareToken, executeTemplate,
} from '@/lib/cloudExport';

// ─── QR Code mock ──────────────────────────────────────────────────────────

function QRMock({ value, size = 120 }: { value: string; size?: number }) {
  const N = 21;
  const cells = useMemo(() => {
    let h = 5381;
    for (let i = 0; i < value.length; i++) h = ((h << 5) + h) ^ value.charCodeAt(i);
    const grid = Array<boolean>(N * N).fill(false);

    function finder(r0: number, c0: number) {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const outer = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[(r0 + r) * N + (c0 + c)] = outer || inner;
        }
    }
    finder(0, 0); finder(0, 14); finder(14, 0);

    let seed = Math.abs(h) >>> 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const skip = (r < 8 && c < 8) || (r < 8 && c >= N - 7) || (r >= N - 7 && c < 8);
        if (!skip) {
          seed = (seed * 1664525 + 1013904223) & 0xffffffff;
          grid[r * N + c] = (seed >>> 0) % 2 === 0;
        }
      }
    return grid;
  }, [value]);

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${N} ${N}`}
      style={{ display: 'block', shapeRendering: 'crispEdges' }}
    >
      <rect width={N} height={N} fill="white" />
      {cells.map((f, i) =>
        f ? (
          <rect key={i} x={i % N} y={Math.floor(i / N)} width={1} height={1} fill="#0f172a" />
        ) : null
      )}
    </svg>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────

type Tab = 'templates' | 'destinations' | 'schedule' | 'history';

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'destinations', label: 'Destinations', icon: Plug2 },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'history', label: 'History', icon: History },
];

export default function CloudExportPanel({ expenses, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('templates');
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [schedule, setSchedule] = useState<ExportSchedule | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Email state
  const [emailTarget, setEmailTarget] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Schedule form
  const [sFreq, setSFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [sTime, setSTime] = useState('09:00');
  const [sDow, setSDow] = useState(1);
  const [sDom, setSDom] = useState(1);
  const [sTpl, setSTpl] = useState(EXPORT_TEMPLATES[0].id);
  const [sDest, setSDest] = useState(CLOUD_DESTINATIONS[0].id);
  const [savingSched, setSavingSched] = useState(false);
  const [schedSaved, setSchedSaved] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    setConnections(loadConnections());
    setHistory(loadHistory());
    setSchedule(loadSchedule());
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const connectedCount = useMemo(
    () => Object.values(connections).filter(Boolean).length,
    [connections]
  );
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleConnect(destId: string) {
    if (connections[destId]) {
      const next = { ...connections, [destId]: false };
      setConnections(next);
      saveConnections(next);
      return;
    }
    setConnecting(destId);
    await new Promise((r) => setTimeout(r, 1800));
    const next = { ...connections, [destId]: true };
    setConnections(next);
    saveConnections(next);
    setConnecting(null);
  }

  async function handleExportTemplate(tpl: typeof EXPORT_TEMPLATES[0]) {
    setExportingId(tpl.id);
    await new Promise((r) => setTimeout(r, 600));
    executeTemplate(tpl, expenses);
    const entry = pushHistory({
      templateName: tpl.name,
      templateEmoji: tpl.emoji,
      destination: 'Local download',
      format: tpl.format.toUpperCase(),
      recordCount: expenses.length,
      totalAmount: totalSpent,
      status: 'success',
    });
    setHistory((h) => [entry, ...h]);
    setExportingId(null);
  }

  async function handleSendEmail() {
    if (!emailInput.trim() || emailStatus !== 'idle') return;
    setEmailStatus('sending');
    await new Promise((r) => setTimeout(r, 1600));
    const entry = pushHistory({
      templateName: 'Email Export',
      templateEmoji: '✉️',
      destination: emailInput.trim(),
      format: 'CSV',
      recordCount: expenses.length,
      totalAmount: totalSpent,
      status: 'success',
    });
    setHistory((h) => [entry, ...h]);
    setEmailStatus('sent');
    setTimeout(() => { setEmailStatus('idle'); setEmailTarget(null); setEmailInput(''); }, 2000);
  }

  function handleGenerateLink() {
    setShareToken(generateShareToken());
    setCopied(false);
  }

  async function handleCopyLink() {
    if (!shareToken) return;
    await navigator.clipboard.writeText(`https://${shareToken}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveSchedule() {
    setSavingSched(true);
    await new Promise((r) => setTimeout(r, 800));
    const s: ExportSchedule = {
      frequency: sFreq,
      time: sTime,
      dayOfWeek: sDow,
      dayOfMonth: sDom,
      templateId: sTpl,
      destinationId: sDest,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    saveSchedule(s);
    setSchedule(s);
    setSavingSched(false);
    setSchedSaved(true);
    setTimeout(() => setSchedSaved(false), 2000);
  }

  function handleDeleteSchedule() {
    saveSchedule(null);
    setSchedule(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:w-[480px] h-full flex flex-col shadow-2xl animate-slide-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Cloud Export</h2>
              <p className="text-xs text-slate-400 leading-tight">
                {connectedCount} service{connectedCount !== 1 ? 's' : ''} connected · {history.length} export{history.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-2 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap',
                tab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Templates tab ─────────────────────────────────────────── */}
          {tab === 'templates' && (
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Export Templates
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {EXPORT_TEMPLATES.map((tpl) => {
                    const isExporting = exportingId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border bg-white hover:bg-slate-50/80 transition-all group',
                          tpl.borderColor
                        )}
                      >
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0',
                            tpl.accentBg
                          )}
                        >
                          {tpl.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-900">{tpl.name}</span>
                            <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', tpl.badgeColor)}>
                              {tpl.badge}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">.{tpl.format}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-snug truncate">{tpl.description}</p>
                          <p className={cn('text-xs mt-0.5 font-medium', tpl.accentColor)}>{tpl.hint}</p>
                        </div>
                        <button
                          onClick={() => handleExportTemplate(tpl)}
                          disabled={isExporting}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all',
                            tpl.accentBg, tpl.accentColor,
                            'hover:opacity-80 disabled:opacity-50'
                          )}
                        >
                          {isExporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          {isExporting ? 'Exporting' : 'Export'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share section */}
              <div className="rounded-xl border border-dashed border-slate-300 p-5 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-800">Share a Snapshot</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Generate a shareable link so others can view your expense summary — no account required.
                </p>

                {!shareToken ? (
                  <button
                    onClick={handleGenerateLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Generate Link
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="rounded-xl overflow-hidden border-2 border-slate-200 shrink-0 bg-white p-1.5">
                        <QRMock value={shareToken} size={100} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-slate-600 truncate flex-1 font-mono">
                            {shareToken}
                          </span>
                          <button onClick={handleCopyLink} className="shrink-0">
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Expires in</span>
                          {['24h', '7 days', '30 days'].map((opt) => (
                            <button
                              key={opt}
                              className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors first:border-indigo-400 first:text-indigo-600 first:bg-indigo-50"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleGenerateLink}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                        >
                          <RefreshCw className="w-3 h-3" /> New link
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Destinations tab ──────────────────────────────────────── */}
          {tab === 'destinations' && (
            <div className="p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Cloud Connections
              </p>
              {CLOUD_DESTINATIONS.map((dest) => {
                const isConnected = !!connections[dest.id];
                const isConnecting = connecting === dest.id;
                const isEmail = dest.id === 'email';

                return (
                  <div
                    key={dest.id}
                    className={cn(
                      'rounded-xl border p-4 transition-all',
                      isConnected
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0',
                          dest.accentBg
                        )}
                      >
                        {dest.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{dest.name}</span>
                            <span className={cn('flex items-center gap-1 text-xs font-medium', isConnected ? 'text-emerald-600' : 'text-slate-400')}>
                              {isConnected ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Connected</>
                              ) : (
                                <><span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" /> Not connected</>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={() => { if (!isEmail || !isConnected) handleConnect(dest.id); }}
                            disabled={isConnecting}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all',
                              isConnected
                                ? 'border border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700',
                              isConnecting && 'opacity-70 cursor-wait'
                            )}
                          >
                            {isConnecting ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</>
                            ) : isConnected ? (
                              <><WifiOff className="w-3.5 h-3.5" /> Disconnect</>
                            ) : (
                              <><Wifi className="w-3.5 h-3.5" /> Connect</>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{dest.description}</p>

                        {isConnected && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {dest.features.map((f) => (
                                <span key={f} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                  ✓ {f}
                                </span>
                              ))}
                            </div>

                            {isEmail && (
                              <div className="mt-2">
                                {emailTarget !== dest.id ? (
                                  <button
                                    onClick={() => setEmailTarget(dest.id)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Send export now
                                  </button>
                                ) : (
                                  <div className="flex gap-2 mt-1">
                                    <input
                                      type="email"
                                      value={emailInput}
                                      onChange={(e) => setEmailInput(e.target.value)}
                                      placeholder="you@example.com"
                                      onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    />
                                    <button
                                      onClick={handleSendEmail}
                                      disabled={!emailInput.trim() || emailStatus !== 'idle'}
                                      className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                                        emailStatus === 'sent'
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                                      )}
                                    >
                                      {emailStatus === 'sending' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : emailStatus === 'sent' ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Sent!</>
                                      ) : (
                                        <Send className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isEmail && (
                              <button
                                onClick={() => handleExportTemplate(EXPORT_TEMPLATES[0])}
                                className={cn('flex items-center gap-1.5 text-xs font-semibold mt-1', dest.accentColor)}
                              >
                                <Send className="w-3.5 h-3.5" /> Send export to {dest.name}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Schedule tab ──────────────────────────────────────────── */}
          {tab === 'schedule' && (
            <div className="p-5 space-y-5">
              {/* Active schedule */}
              {schedule && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        <span className="text-sm font-semibold text-slate-900">Active Schedule</span>
                      </div>
                      <p className="text-sm text-indigo-700 font-medium">{describeSchedule(schedule)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {EXPORT_TEMPLATES.find((t) => t.id === schedule.templateId)?.name ?? schedule.templateId}
                        {' → '}
                        {CLOUD_DESTINATIONS.find((d) => d.id === schedule.destinationId)?.name ?? schedule.destinationId}
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteSchedule}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Schedule form */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  {schedule ? 'Replace Schedule' : 'Set Up Automatic Backups'}
                </p>
                <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setSFreq(f)}
                          className={cn(
                            'py-2 rounded-lg text-xs font-semibold border-2 capitalize transition-all',
                            sFreq === f
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Time</label>
                      <input
                        type="time"
                        value={sTime}
                        onChange={(e) => setSTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {sFreq === 'weekly' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Day</label>
                        <select
                          value={sDow}
                          onChange={(e) => setSDow(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                            <option key={d} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {sFreq === 'monthly' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Day of month</label>
                        <select
                          value={sDom}
                          onChange={(e) => setSDom(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Template + Destination */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Template</label>
                      <select
                        value={sTpl}
                        onChange={(e) => setSTpl(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {EXPORT_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Destination</label>
                      <select
                        value={sDest}
                        onChange={(e) => setSDest(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {CLOUD_DESTINATIONS.map((d) => (
                          <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSchedule}
                    disabled={savingSched}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                      schedSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    )}
                  >
                    {savingSched ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : schedSaved ? (
                      <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    ) : (
                      'Save Schedule'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── History tab ───────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Export History
                </p>
                {history.length > 0 && (
                  <button
                    onClick={() => { clearHistory(); setHistory([]); }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                    📭
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No exports yet</p>
                  <p className="text-xs text-slate-400">
                    Use the Templates or Destinations tabs to run your first export
                  </p>
                </div>
              ) : (
                <ol className="space-y-2">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0">
                        {item.templateEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{item.templateName}</span>
                          <span className="text-xs font-mono text-slate-400">{item.format}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="truncate">{item.destination}</span>
                          <span>·</span>
                          <span className="whitespace-nowrap">
                            {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-800">{formatCurrency(item.totalAmount)}</p>
                        <p className="text-xs text-slate-400">{item.recordCount} records</p>
                      </div>
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          item.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                        )}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

        </div>

        {/* Footer status bar */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-400 tabular-nums">
            {expenses.length} expenses · {formatCurrency(totalSpent)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                connectedCount > 0 ? 'bg-emerald-400' : 'bg-slate-300'
              )}
            />
            {connectedCount > 0 ? `${connectedCount} connected` : 'No services connected'}
          </span>
        </div>

      </div>
    </div>
  );
}
