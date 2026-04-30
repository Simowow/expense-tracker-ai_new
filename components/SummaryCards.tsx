'use client';

import { SummaryStats } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, BarChart3, Tag } from 'lucide-react';

interface Props {
  stats: SummaryStats;
}

export default function SummaryCards({ stats }: Props) {
  const monthDiff =
    stats.totalLastMonth > 0
      ? ((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100
      : null;

  const cards = [
    {
      label: 'Total Spending',
      value: formatCurrency(stats.totalAll),
      sub: `${stats.expenseCount} expense${stats.expenseCount !== 1 ? 's' : ''} recorded`,
      icon: Wallet,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      label: 'This Month',
      value: formatCurrency(stats.totalThisMonth),
      sub:
        monthDiff !== null
          ? `${monthDiff >= 0 ? '▲' : '▼'} ${Math.abs(monthDiff).toFixed(1)}% vs last month`
          : 'No comparison data',
      icon: monthDiff !== null && monthDiff > 0 ? TrendingUp : TrendingDown,
      iconColor: monthDiff !== null && monthDiff > 0 ? 'text-red-500' : 'text-emerald-600',
      iconBg: monthDiff !== null && monthDiff > 0 ? 'bg-red-50' : 'bg-emerald-50',
      subColor: monthDiff !== null && monthDiff > 0 ? 'text-red-500' : 'text-emerald-600',
    },
    {
      label: 'Last Month',
      value: formatCurrency(stats.totalLastMonth),
      sub: 'Previous month total',
      icon: CalendarDays,
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-100',
    },
    {
      label: 'Daily Average',
      value: formatCurrency(stats.averagePerDay),
      sub: stats.topCategory ? `Top category: ${stats.topCategory}` : 'No data this month',
      icon: stats.topCategory ? Tag : BarChart3,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, iconColor, iconBg, subColor }) => (
        <div
          key={label}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                {label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">{value}</p>
              <p className={`text-xs mt-1.5 ${subColor ?? 'text-slate-400'}`}>{sub}</p>
            </div>
            <div className={`${iconBg} p-2.5 rounded-xl shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
