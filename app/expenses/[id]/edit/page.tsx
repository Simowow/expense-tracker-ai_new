'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { ExpenseFormData } from '@/lib/types';
import ExpenseForm from '@/components/ExpenseForm';
import { useToast, ToastContainer } from '@/components/Toast';

export default function EditPage() {
  const params = useParams();
  const id = params.id as string;
  const { expenses, isLoaded, updateExpense } = useExpenses();
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

  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Expense not found</h2>
          <p className="text-sm text-slate-400 mb-4">
            This expense may have been deleted or the link is incorrect.
          </p>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to expenses
          </Link>
        </div>
      </div>
    );
  }

  function handleSubmit(data: ExpenseFormData) {
    setSaving(true);
    updateExpense(id, data);
    toast('Expense updated!');
    setTimeout(() => router.push('/expenses'), 700);
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/expenses"
          className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Expense</h1>
          <p className="text-sm text-slate-400 mt-0.5">Update transaction details</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <ExpenseForm
          onSubmit={handleSubmit}
          initialData={expense}
          submitLabel="Save Changes"
          isLoading={saving}
        />
      </div>
    </div>
  );
}
