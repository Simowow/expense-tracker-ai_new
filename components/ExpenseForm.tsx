'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CATEGORIES, Category, ExpenseFormData, Expense, CATEGORY_ICONS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  onSubmit: (data: ExpenseFormData) => void;
  initialData?: Expense;
  submitLabel?: string;
  isLoading?: boolean;
}

type FormErrors = Partial<Record<keyof ExpenseFormData, string>>;

export default function ExpenseForm({
  onSubmit,
  initialData,
  submitLabel = 'Add Expense',
  isLoading = false,
}: Props) {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState<ExpenseFormData>({
    date: initialData?.date ?? today,
    amount: initialData ? String(initialData.amount) : '',
    category: initialData?.category ?? 'Food',
    description: initialData?.description ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.date) next.date = 'Date is required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0)
      next.amount = 'Enter a valid amount greater than $0.00';
    if (!form.description.trim()) next.description = 'Description is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  function update<K extends keyof ExpenseFormData>(field: K, value: ExpenseFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const inputClass = (field: keyof ExpenseFormData) =>
    cn(
      'w-full px-3 py-2.5 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow',
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Amount <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg pointer-events-none">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            placeholder="0.00"
            className={cn(
              'w-full pl-8 pr-4 py-2.5 rounded-lg border text-slate-900 font-semibold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow',
              errors.amount
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            )}
          />
        </div>
        {errors.amount && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">⚠ {errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => update('category', cat)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                form.category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Date <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={form.date}
          max={today}
          onChange={(e) => update('date', e.target.value)}
          className={inputClass('date')}
        />
        {errors.date && <p className="mt-1.5 text-xs text-red-600">⚠ {errors.date}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What did you spend on?"
          maxLength={100}
          className={inputClass('description')}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-xs text-red-600">⚠ {errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400">{form.description.length}/100</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-200"
        >
          {isLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
