'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseFormData } from '../types';
import { loadExpenses, saveExpenses } from '../storage';
import { generateId } from '../utils';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveExpenses(expenses);
  }, [expenses, isLoaded]);

  const addExpense = useCallback((data: ExpenseFormData): Expense => {
    const now = new Date().toISOString();
    const expense: Expense = {
      id: generateId(),
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setExpenses((prev) =>
      [expense, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, data: ExpenseFormData): void => {
    setExpenses((prev) =>
      prev
        .map((e) =>
          e.id === id
            ? {
                ...e,
                date: data.date,
                amount: parseFloat(data.amount),
                category: data.category,
                description: data.description.trim(),
                updatedAt: new Date().toISOString(),
              }
            : e
        )
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const deleteExpense = useCallback((id: string): void => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const deleteMany = useCallback((ids: string[]): void => {
    const set = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !set.has(e.id)));
  }, []);

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense, deleteMany };
}
