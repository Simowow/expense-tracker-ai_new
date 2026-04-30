'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { ExpenseFormData } from '@/lib/types';
import ExpenseForm from '@/components/ExpenseForm';
import { useToast, ToastContainer } from '@/components/Toast';

export default function AddPage() {
  const { addExpense, isLoaded } = useExpenses();
  const router = useRouter();
  const { toast, toasts, dismiss } = useToast();
  const [saving, setSaving] = useState(false);

  if (!isLoaded) {
    return (
      <div className="p-6 lg:p-8 max-w-lg animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-lg mb-6" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  function handleSubmit(data: ExpenseFormData) {
    setSaving(true);
    addExpense(data);
    toast('Expense added successfully!');
    setTimeout(() => router.push('/expenses'), 700);
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
          <p className="text-sm text-slate-400 mt-0.5">Record a new transaction</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <ExpenseForm onSubmit={handleSubmit} submitLabel="Add Expense" isLoading={saving} />
      </div>
    </div>
  );
}
