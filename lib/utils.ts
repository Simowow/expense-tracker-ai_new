import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
} from 'date-fns';
import { Expense, Category, CATEGORIES, SummaryStats } from './types';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MM/dd/yyyy');
}

export function computeStats(expenses: Expense[]): SummaryStats {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  const thisMonthExpenses = expenses.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: thisMonthStart, end: thisMonthEnd })
  );
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const totalLastMonth = expenses
    .filter((e) =>
      isWithinInterval(parseISO(e.date), { start: lastMonthStart, end: lastMonthEnd })
    )
    .reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return acc;
    },
    {} as Record<Category, number>
  );

  const topCategory =
    (Object.entries(categoryTotals) as [Category, number][])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const dayOfMonth = now.getDate();
  const averagePerDay = dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0;

  return {
    totalAll,
    totalThisMonth,
    totalLastMonth,
    averagePerDay,
    expenseCount: expenses.length,
    topCategory,
    categoryTotals,
  };
}

export function getMonthlyData(expenses: Expense[], months = 6) {
  return Array.from({ length: months }, (_, i) => {
    const month = subMonths(new Date(), months - 1 - i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const total = expenses
      .filter((e) => isWithinInterval(parseISO(e.date), { start, end }))
      .reduce((s, e) => s + e.amount, 0);
    return { month: format(month, 'MMM'), fullMonth: format(month, 'MMMM yyyy'), total };
  });
}

export function getCategoryData(expenses: Expense[]) {
  return CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  })).filter((d) => d.value > 0);
}

export function getDailyData(expenses: Expense[], year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const total = expenses
      .filter((e) => e.date === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    return { day: format(day, 'd'), date: dateStr, total };
  });
}
