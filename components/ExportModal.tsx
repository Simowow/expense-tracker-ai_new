'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import {
  X,
  Download,
  Loader2,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  FileText,
} from 'lucide-react';
import { Expense, Category, CATEGORIES, CATEGORY_COLORS } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { downloadCSV, downloadJSON, downloadPDF } from '@/lib/export';
import CategoryBadge from './CategoryBadge';

type ExportFormat = 'csv' | 'json' | 'pdf';
type ExportStatus = 'idle' | 'exporting' | 'done';

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

const FORMATS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  ext: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet compatible',
    ext: '.csv',
    icon: FileSpreadsheet,
    color: 'text-emerald-600',
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Developer friendly',
    ext: '.json',
    icon: FileJson,
    color: 'text-blue-600',
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Print ready report',
    ext: '.pdf',
    icon: FileText,
    color: 'text-red-500',
  },
];

export default function ExportModal({ expenses, onClose }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    new Set(CATEGORIES)
  );
  const [filename, setFilename] = useState(`expenses-${today}`);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (!selectedCategories.has(e.category)) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [expenses, selectedCategories, dateFrom, dateTo]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  const previewRows = showFullPreview ? filtered : filtered.slice(0, 5);
  const hiddenCount = filtered.length - previewRows.length;

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  async function handleExport() {
    if (filtered.length === 0 || status !== 'idle') return;
    setStatus('exporting');
    await new Promise((r) => setTimeout(r, 700));

    const name = filename.trim() || `expenses-${today}`;
    if (exportFormat === 'csv') downloadCSV(filtered, name);
    else if (exportFormat === 'json') downloadJSON(filtered, name);
    else downloadPDF(filtered, name);

    setStatus('done');
    setTimeout(() => { onClose(); }, 1400);
  }

  const currentFormat = FORMATS.find((f) => f.value === exportFormat)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-fade-in rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Export Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure options, preview, then download
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-7">

            {/* ── Format ── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Format
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  const active = exportFormat === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => setExportFormat(fmt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                        active
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <Icon
                        className={cn('w-7 h-7', active ? fmt.color : 'text-slate-300')}
                      />
                      <div>
                        <p
                          className={cn(
                            'text-sm font-bold',
                            active ? 'text-indigo-700' : 'text-slate-600'
                          )}
                        >
                          {fmt.label}
                        </p>
                        <p
                          className={cn(
                            'text-xs mt-0.5',
                            active ? 'text-indigo-400' : 'text-slate-400'
                          )}
                        >
                          {fmt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Date Range ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Date Range
                </h3>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || today}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={today}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* ── Categories ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Categories
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedCategories(new Set(CATEGORIES))}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    All
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => setSelectedCategories(new Set())}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all',
                        active
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                      )}
                      style={active ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                    >
                      {active && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── File Name ── */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                File Name
              </h3>
              <div className="flex items-stretch">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`expenses-${today}`}
                  className="flex-1 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="flex items-center px-3 rounded-r-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 font-semibold shrink-0 select-none">
                  {currentFormat.ext}
                </span>
              </div>
            </section>

            {/* ── Preview ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Preview
                  </h3>
                  <span
                    className={cn(
                      'text-xs font-bold px-2.5 py-0.5 rounded-full',
                      filtered.length === 0
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-700'
                    )}
                  >
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''} · {formatCurrency(totalAmount)}
                  </span>
                </div>
                {filtered.length > 5 && (
                  <button
                    onClick={() => setShowFullPreview((s) => !s)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {showFullPreview ? 'Collapse' : `Show all ${filtered.length}`}
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        showFullPreview && 'rotate-180'
                      )}
                    />
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="py-10 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-semibold text-slate-500">No records match your filters</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Adjust the date range or enable more categories
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className={cn('overflow-x-auto', showFullPreview ? 'max-h-72' : '')}>
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {['Date', 'Description', 'Category', 'Amount'].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {previewRows.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                              {formatDate(e.date)}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-800 max-w-[180px] truncate">
                              {e.description}
                            </td>
                            <td className="px-4 py-2.5">
                              <CategoryBadge category={e.category} size="sm" />
                            </td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-900 tabular-nums">
                              {formatCurrency(e.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!showFullPreview && hiddenCount > 0 && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
                      … and {hiddenCount} more record{hiddenCount !== 1 ? 's' : ''} not shown
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 hidden sm:block">
            {filtered.length > 0 ? (
              <>
                <span className="font-semibold text-slate-700">{filtered.length}</span> record
                {filtered.length !== 1 ? 's' : ''} as{' '}
                <span className={cn('font-semibold', currentFormat.color)}>
                  {currentFormat.label}
                </span>
                {' '}· <span className="font-semibold text-slate-700">{formatCurrency(totalAmount)}</span>
              </>
            ) : (
              <span className="text-red-500 font-medium">No records to export</span>
            )}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0 || status !== 'idle'}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-w-36 justify-center',
                status === 'done'
                  ? 'bg-emerald-500 text-white'
                  : filtered.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
              )}
            >
              {status === 'exporting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting…
                </>
              ) : status === 'done' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {currentFormat.label}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
