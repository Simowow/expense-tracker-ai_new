'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Expense, CATEGORY_COLORS, Category } from '@/lib/types';
import { getCategoryData, formatCurrency } from '@/lib/utils';

interface Props {
  expenses: Expense[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-slate-700">{payload[0].name}</p>
      <p className="text-base font-bold" style={{ color: payload[0].payload.fill }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function CategoryChart({ expenses }: Props) {
  const data = useMemo(() => getCategoryData(expenses), [expenses]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center h-[300px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">No data yet</p>
        <p className="text-slate-300 text-xs mt-1">Add expenses to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">By Category</h3>
      <p className="text-xs text-slate-400 mb-4">All time breakdown</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={45}
              strokeWidth={2}
              stroke="white"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name as Category]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2 min-w-0">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[entry.name as Category] }}
              />
              <span className="text-xs text-slate-600 flex-1 truncate">{entry.name}</span>
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                {total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
