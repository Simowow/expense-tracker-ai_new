'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useExpenses } from '@/lib/hooks/useExpenses';
import {
  computeStats,
  getMonthlyData,
  getCategoryData,
  getDailyData,
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORIES, Category } from '@/lib/types';
import CategoryBadge from '@/components/CategoryBadge';
import DailyChart from '@/components/DailyChart';

interface MonthlyTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { fullMonth: string } }>;
}

function MonthlyTooltip({ active, payload }: MonthlyTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-slate-500 mb-0.5">{payload[0].payload.fullMonth}</p>
      <p className="text-base font-bold text-indigo-600">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-slate-700">{payload[0].name}</p>
      <p className="text-base font-bold" style={{ color: payload[0].payload.fill }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AnalyticsPage() {
  const { expenses, isLoaded } = useExpenses();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());

  const stats = useMemo(() => computeStats(expenses), [expenses]);
  const monthlyData = useMemo(() => getMonthlyData(expenses, 6), [expenses]);
  const categoryData = useMemo(() => getCategoryData(expenses), [expenses]);
  const dailyData = useMemo(
    () => getDailyData(expenses, selectedYear, selectedMonth),
    [expenses, selectedYear, selectedMonth]
  );

  const top5 = useMemo(
    () => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [expenses]
  );

  const categoryBreakdown = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return CATEGORIES.map((cat) => {
      const catExpenses = expenses.filter((e) => e.category === cat);
      const catTotal = catExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        category: cat,
        count: catExpenses.length,
        total: catTotal,
        avg: catExpenses.length > 0 ? catTotal / catExpenses.length : 0,
        pct: total > 0 ? (catTotal / total) * 100 : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [expenses]);

  if (!isLoaded) {
    return (
      <div className="p-6 lg:p-8 space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Insights from {expenses.length} expenses
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Spending', value: formatCurrency(stats.totalAll) },
          { label: 'This Month', value: formatCurrency(stats.totalThisMonth) },
          { label: 'Avg per Day', value: formatCurrency(stats.averagePerDay) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly + Category charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Monthly Spending</h3>
          <p className="text-xs text-slate-400 mb-4">Last 6 months comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
                width={50}
              />
              <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" fill="#6366f1" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category donut */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Category Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">All time, by spending category</p>
          {categoryData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="white"
                >
                  {categoryData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name as Category]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily spending + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily spending */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Daily Spending</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m} {selectedYear}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Day-by-day for {MONTHS[selectedMonth]} {selectedYear}
          </p>
          <DailyChart expenses={expenses} year={selectedYear} month={selectedMonth} />
          <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>
              {dailyData.filter((d) => d.total > 0).length} days with spending
            </span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(dailyData.reduce((s, d) => s + d.total, 0))} total
            </span>
          </div>
        </div>

        {/* Top 5 expenses */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Largest Expenses</h3>
          <p className="text-xs text-slate-400 mb-4">Your top 5 transactions</p>
          {top5.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No expenses yet
            </div>
          ) : (
            <ol className="space-y-3">
              {top5.map((e, i) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? 'bg-amber-100 text-amber-700'
                        : i === 1
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryBadge category={e.category} size="sm" />
                      <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                    {formatCurrency(e.amount)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Category Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">Full analysis by spending category</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                {['Category', 'Transactions', 'Total', 'Avg/transaction', 'Share'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categoryBreakdown.map(({ category, count, total, avg, pct }) => (
                <tr key={category} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <CategoryBadge category={category} showIcon />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {count}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(total)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums">
                    {count > 0 ? formatCurrency(avg) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-20">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_COLORS[category],
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 tabular-nums w-8">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
