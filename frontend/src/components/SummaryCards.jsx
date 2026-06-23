import { formatCurrency } from '../constants.js';

/**
 * Dashboard summary cards. Uses global pipeline stats from the backend
 * (aggregated across the whole shared pipeline, not just the current page).
 */
export default function SummaryCards({ stats }) {
  const s = stats || { openPipelineValue: 0, wonValue: 0, highPriorityCount: 0, total: 0 };

  const cards = [
    { label: 'Open pipeline value', value: formatCurrency(s.openPipelineValue), accent: 'text-brand-600' },
    { label: 'Won value', value: formatCurrency(s.wonValue), accent: 'text-green-600' },
    { label: 'High-priority deals', value: s.highPriorityCount, accent: 'text-red-600' },
    { label: 'Total opportunities', value: s.total, accent: 'text-slate-700' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
          <p className={`mt-1 text-xl font-bold ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
