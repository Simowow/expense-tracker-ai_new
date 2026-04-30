'use client';

import Link from 'next/link';
import { Expense } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import CategoryBadge from './CategoryBadge';
import { ArrowRight, Receipt } from 'lucide-react';

interface Props {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: Props) {
  const recent = expenses.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Expenses</h3>
          <p className="text-xs text-slate-400 mt-0.5">Latest transactions</p>
        </div>
        <Link
          href="/expenses"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">No expenses yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Add your first expense to get started</p>
          </div>
          <Link
            href="/add"
            className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            + Add expense
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {recent.map((e) => (
            <li key={e.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(e.date)}</p>
              </div>
              <CategoryBadge category={e.category} size="sm" />
              <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                {formatCurrency(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
