import { format, subDays } from 'date-fns';
import { Expense, Category } from './types';
import { generateId } from './utils';

const STORAGE_KEY = 'expense_tracker_v1';

export function loadExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSampleExpenses();
    return JSON.parse(raw) as Expense[];
  } catch {
    return getSampleExpenses();
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function clearExpenses(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Description', 'Category', 'Amount'];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function make(
  daysAgo: number,
  amount: number,
  category: Category,
  description: string
): Expense {
  const now = new Date();
  const date = format(subDays(now, daysAgo), 'yyyy-MM-dd');
  const ts = new Date(date).toISOString();
  return { id: generateId(), date, amount, category, description, createdAt: ts, updatedAt: ts };
}

function getSampleExpenses(): Expense[] {
  return [
    make(0, 12.5, 'Food', 'Lunch at cafe'),
    make(1, 45.0, 'Shopping', 'Grocery store'),
    make(2, 3.5, 'Transportation', 'Bus fare'),
    make(3, 28.0, 'Entertainment', 'Movie tickets'),
    make(4, 120.0, 'Bills', 'Electric bill'),
    make(5, 15.75, 'Food', 'Coffee and pastries'),
    make(6, 55.0, 'Shopping', 'Clothing store'),
    make(7, 9.99, 'Entertainment', 'Streaming subscription'),
    make(8, 22.0, 'Food', 'Dinner out'),
    make(9, 35.0, 'Transportation', 'Gas fill-up'),
    make(10, 8.5, 'Food', 'Breakfast'),
    make(12, 200.0, 'Bills', 'Internet bill'),
    make(14, 65.0, 'Shopping', 'Books and supplies'),
    make(16, 18.0, 'Entertainment', 'Concert ticket'),
    make(18, 33.5, 'Food', 'Weekly meal prep'),
    make(20, 12.0, 'Transportation', 'Parking fee'),
    make(22, 150.0, 'Bills', 'Phone bill'),
    make(25, 42.0, 'Shopping', 'Household items'),
    make(28, 75.0, 'Entertainment', 'Sports event'),
    make(32, 28.0, 'Food', 'Restaurant dinner'),
    make(35, 88.0, 'Bills', 'Gym membership'),
    make(38, 19.5, 'Transportation', 'Uber rides'),
    make(42, 46.0, 'Food', 'Weekly groceries'),
    make(45, 15.0, 'Entertainment', 'Books'),
  ];
}
