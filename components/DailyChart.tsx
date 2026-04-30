'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Expense } from '@/lib/types';
import { getDailyData, formatCurrency } from '@/lib/utils';

interface Props {
  expenses: Expense[];
  year: number;
  month: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || !payload[0].value) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-slate-500 mb-0.5">Day {label}</p>
      <p className="text-base font-bold text-indigo-600">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function DailyChart({ expenses, year, month }: Props) {
  const data = useMemo(() => getDailyData(expenses, year, month), [expenses, year, month]);

  const maxVal = useMemo(() => Math.max(...data.map((d) => d.total)), [data]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="total" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.total === maxVal && maxVal > 0 ? '#6366f1' : '#c7d2fe'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
