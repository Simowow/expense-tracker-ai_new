import { format } from 'date-fns';
import { Expense } from './types';

// ─── Download helpers ──────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(expenses: Expense[], filename: string) {
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount.toFixed(2),
  ]);
  const csv = [['Date', 'Description', 'Category', 'Amount'].join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerDownload(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadJSON(expenses: Expense[], filename: string) {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map(({ id: _id, createdAt: _c, updatedAt: _u, ...rest }) => rest),
  };
  triggerDownload(JSON.stringify(payload, null, 2), `${filename}.json`, 'application/json');
}

export function downloadPDF(expenses: Expense[], filename: string) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const rows = expenses
    .map(
      (e) =>
        `<tr><td>${e.date}</td><td>${e.description.replace(/</g, '&lt;')}</td><td>${e.category}</td><td>$${e.amount.toFixed(2)}</td></tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title>
<style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b;font-size:13px}
h1{font-size:22px;font-weight:700;margin-bottom:20px}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e2e8f0}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
tfoot td{font-weight:700;border-top:2px solid #cbd5e1;background:#f8fafc}
</style></head><body><h1>Expense Report — ${filename}</h1>
<p style="color:#64748b;margin-bottom:20px">${expenses.length} records · Total $${total.toFixed(2)} · ${format(new Date(), 'MMMM d, yyyy')}</p>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="3">Total</td><td>$${total.toFixed(2)}</td></tr></tfoot></table>
</body></html>`;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
}

// ─── Templates ─────────────────────────────────────────────────────────────

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  hint: string;
  emoji: string;
  format: 'csv' | 'json' | 'pdf';
  badge: string;
  badgeColor: string;
  accentColor: string;
  accentBg: string;
  borderColor: string;
}

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'All expenses grouped by category with deductible subtotals',
    hint: 'Ideal for accountants & tax software',
    emoji: '🧾',
    format: 'csv',
    badge: 'Year-end',
    badgeColor: 'text-emerald-700 bg-emerald-100',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: "This month's expenses with weekly rollups and totals",
    hint: 'Perfect for monthly budget reviews',
    emoji: '📅',
    format: 'pdf',
    badge: 'Monthly',
    badgeColor: 'text-blue-700 bg-blue-100',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'Spending breakdown with trend percentages vs last month',
    hint: 'Great for spotting budget leaks',
    emoji: '📊',
    format: 'csv',
    badge: 'Analytics',
    badgeColor: 'text-purple-700 bg-purple-100',
    accentColor: 'text-purple-600',
    accentBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'full-backup',
    name: 'Full Backup',
    description: 'Complete export with all metadata as structured JSON',
    hint: 'Use to migrate or restore your data',
    emoji: '💾',
    format: 'json',
    badge: 'Backup',
    badgeColor: 'text-slate-600 bg-slate-100',
    accentColor: 'text-slate-600',
    accentBg: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
];

export function executeTemplate(template: ExportTemplate, expenses: Expense[]) {
  const filename = `${template.id}-${format(new Date(), 'yyyy-MM-dd')}`;
  if (template.format === 'csv') downloadCSV(expenses, filename);
  else if (template.format === 'json') downloadJSON(expenses, filename);
  else downloadPDF(expenses, filename);
}

// ─── Destinations ──────────────────────────────────────────────────────────

export interface CloudDestination {
  id: string;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
  accentBg: string;
  features: string[];
}

export const CLOUD_DESTINATIONS: CloudDestination[] = [
  {
    id: 'email',
    name: 'Email',
    emoji: '✉️',
    description: 'Send exports directly to your inbox',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
    features: ['Scheduled delivery', 'Multiple recipients', 'Custom subject line'],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    emoji: '📗',
    description: 'Sync live data to a Google Sheet',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    features: ['Live sync', 'Auto pivot tables', 'Share with team'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    emoji: '📦',
    description: 'Automatically save exports to Dropbox',
    accentColor: 'text-blue-700',
    accentBg: 'bg-sky-50',
    features: ['Version history', 'Auto-sync on export', 'Mobile access'],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    emoji: '☁️',
    description: 'Sync to Microsoft 365 and OneDrive',
    accentColor: 'text-sky-600',
    accentBg: 'bg-sky-50',
    features: ['Excel integration', 'SharePoint sync', 'Teams sharing'],
  },
  {
    id: 'slack',
    name: 'Slack',
    emoji: '💬',
    description: 'Post summaries to any Slack channel',
    accentColor: 'text-purple-600',
    accentBg: 'bg-purple-50',
    features: ['Channel posts', 'Bot notifications', 'Scheduled digests'],
  },
  {
    id: 'notion',
    name: 'Notion',
    emoji: '🗒️',
    description: 'Import expenses into a Notion database',
    accentColor: 'text-slate-700',
    accentBg: 'bg-slate-100',
    features: ['Database sync', 'Relation links', 'Custom filter views'],
  },
];

// ─── Export History ────────────────────────────────────────────────────────

export interface ExportHistoryItem {
  id: string;
  timestamp: string;
  templateName: string;
  templateEmoji: string;
  destination: string;
  format: string;
  recordCount: number;
  totalAmount: number;
  status: 'success' | 'failed';
}

const HISTORY_KEY = 'expense_cloud_history_v1';
const CONNECTIONS_KEY = 'expense_cloud_connections_v1';
const SCHEDULE_KEY = 'expense_cloud_schedule_v1';

export function loadHistory(): ExportHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}

export function pushHistory(item: Omit<ExportHistoryItem, 'id' | 'timestamp'>): ExportHistoryItem {
  const entry: ExportHistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const prev = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...prev].slice(0, 50)));
  return entry;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Connections ───────────────────────────────────────────────────────────

export function loadConnections(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(CONNECTIONS_KEY) ?? '{}'); } catch { return {}; }
}

export function saveConnections(c: Record<string, boolean>): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(c));
}

// ─── Schedule ──────────────────────────────────────────────────────────────

export interface ExportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek: number;
  dayOfMonth: number;
  templateId: string;
  destinationId: string;
  enabled: boolean;
  createdAt: string;
}

export function loadSchedule(): ExportSchedule | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem(SCHEDULE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export function saveSchedule(s: ExportSchedule | null): void {
  s === null
    ? localStorage.removeItem(SCHEDULE_KEY)
    : localStorage.setItem(SCHEDULE_KEY, JSON.stringify(s));
}

export function describeSchedule(s: ExportSchedule): string {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [h, m] = s.time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const t = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  if (s.frequency === 'daily') return `Every day at ${t}`;
  if (s.frequency === 'weekly') return `Every ${DAYS[s.dayOfWeek]} at ${t}`;
  return `Monthly on day ${s.dayOfMonth} at ${t}`;
}

// ─── Share Link ────────────────────────────────────────────────────────────

export function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const token = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `expensetrack.app/shared/${token}`;
}
