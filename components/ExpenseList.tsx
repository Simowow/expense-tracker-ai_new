'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Expense, Category, CATEGORIES } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV } from '@/lib/storage';
import CategoryBadge from './CategoryBadge';
import {
  Search,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Download,
  SlidersHorizontal,
  X,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
}

type SortField = 'date' | 'amount' | 'category' | 'description';

export default function ExpenseList({ expenses, onDelete, onDeleteMany }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let r = [...expenses];
    if (search) r = r.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== 'All') r = r.filter((e) => e.category === categoryFilter);
    if (dateFrom) r = r.filter((e) => e.date >= dateFrom);
    if (dateTo) r = r.filter((e) => e.date <= dateTo);
    r.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else cmp = a.description.localeCompare(b.description);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [expenses, search, categoryFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalFiltered = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === filtered.length && filtered.length > 0
        ? new Set()
        : new Set(filtered.map((e) => e.id))
    );
  }

  function deleteSelected() {
    if (!confirm(`Delete ${selected.size} expense${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    onDeleteMany(Array.from(selected));
    setSelected(new Set());
  }

  function clearFilters() {
    setSearch('');
    setCategoryFilter('All');
    setDateFrom('');
    setDateTo('');
  }

  const hasActiveFilters = search || categoryFilter !== 'All' || dateFrom || dateTo;

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-600 inline ml-1" />
      : <ChevronDown className="w-3 h-3 text-indigo-600 inline ml-1" />;
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0',
              showFilters || hasActiveFilters
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </button>

          <button
            onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {!dateFrom && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    From date
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {!dateTo && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    To date
                  </span>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm font-semibold text-indigo-700">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                {hasActiveFilters ? 'No matching expenses' : 'No expenses yet'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first expense above'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    {(
                      [
                        { field: 'date' as SortField, label: 'Date' },
                        { field: 'description' as SortField, label: 'Description' },
                        { field: 'category' as SortField, label: 'Category' },
                        { field: 'amount' as SortField, label: 'Amount' },
                      ] as const
                    ).map(({ field, label }) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                      >
                        {label}
                        <SortIcon field={field} />
                      </th>
                    ))}
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      className={cn(
                        'hover:bg-slate-50/60 transition-colors group',
                        selected.has(e.id) && 'bg-indigo-50/40'
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900 max-w-xs">
                        <span className="truncate block">{e.description}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <CategoryBadge category={e.category} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/expenses/${e.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Delete this expense?')) onDelete(e.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="sm:hidden divide-y divide-slate-50">
              {filtered.map((e) => (
                <li key={e.id} className={cn('px-4 py-3.5', selected.has(e.id) && 'bg-indigo-50/40')}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                        <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                          {formatCurrency(e.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <CategoryBadge category={e.category} size="sm" />
                        <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/expenses/${e.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Delete this expense?')) onDelete(e.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-400">
              {filtered.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatCurrency(totalFiltered)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
