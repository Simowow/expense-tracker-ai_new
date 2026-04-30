'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/lib/hooks/useExpenses';
import ExpenseList from '@/components/ExpenseList';
import { useToast, ToastContainer } from '@/components/Toast';

export default function ExpensesPage() {
  const { expenses, isLoaded, deleteExpense, deleteMany } = useExpenses();
  const { toast, toasts, dismiss } = useToast();

  if (!isLoaded) {
    return (
      <div className="p-6 lg:p-8 space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        <div className="h-16 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/add"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      <ExpenseList
        expenses={expenses}
        onDelete={(id) => {
          deleteExpense(id);
          toast('Expense deleted');
        }}
        onDeleteMany={(ids) => {
          deleteMany(ids);
          toast(`${ids.length} expense${ids.length !== 1 ? 's' : ''} deleted`);
        }}
      />
    </div>
  );
}
