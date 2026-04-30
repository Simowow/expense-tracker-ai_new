import { format } from 'date-fns';
import { Expense } from './types';

export function downloadCSV(expenses: Expense[], filename: string): void {
  const headers = ['Date', 'Description', 'Category', 'Amount'];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  triggerDownload(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadJSON(expenses: Expense[], filename: string): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map((e) => ({
      date: e.date,
      description: e.description,
      category: e.category,
      amount: e.amount,
    })),
  };
  triggerDownload(JSON.stringify(payload, null, 2), `${filename}.json`, 'application/json');
}

export function downloadPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  }
  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const rows = expenses
    .map(
      (e) => `
    <tr>
      <td>${e.date}</td>
      <td>${e.description.replace(/</g, '&lt;')}</td>
      <td><span class="badge cat-${e.category.toLowerCase()}">${e.category}</span></td>
      <td class="amount">$${e.amount.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${filename}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;padding:40px;font-size:13px}
    h1{font-size:24px;font-weight:700;letter-spacing:-0.5px}
    .subtitle{color:#64748b;font-size:12px;margin-top:4px;margin-bottom:28px}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
    .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px}
    .stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:600}
    .stat-value{font-size:22px;font-weight:800;margin-top:4px;color:#0f172a}
    table{width:100%;border-collapse:collapse}
    th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0}
    th.amount,td.amount{text-align:right}
    td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
    tfoot td{font-weight:700;border-top:2px solid #cbd5e1;background:#f8fafc;font-size:13px}
    .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}
    .cat-food{background:#fff7ed;color:#c2410c}
    .cat-transportation{background:#eff6ff;color:#1d4ed8}
    .cat-entertainment{background:#faf5ff;color:#7e22ce}
    .cat-shopping{background:#fdf2f8;color:#be185d}
    .cat-bills{background:#fef2f2;color:#b91c1c}
    .cat-other{background:#f8fafc;color:#475569}
    @media print{body{padding:20px}@page{margin:20mm}}
  </style>
</head>
<body>
  <h1>Expense Report</h1>
  <p class="subtitle">Generated ${format(new Date(), 'MMMM d, yyyy')} &nbsp;·&nbsp; ${filename}</p>
  <div class="stats">
    <div class="stat">
      <div class="stat-label">Records</div>
      <div class="stat-value">${expenses.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Spent</div>
      <div class="stat-value">$${total.toFixed(2)}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Top Category</div>
      <div class="stat-value" style="font-size:16px;padding-top:6px">${topCat ? topCat[0] : '—'}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">Total</td><td class="amount">$${total.toFixed(2)}</td></tr></tfoot>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
