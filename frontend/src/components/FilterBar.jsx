import { STAGES, PRIORITIES, SORT_OPTIONS } from '../constants.js';

export default function FilterBar({ filters, onChange, view, onViewChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="card flex flex-col gap-3 p-3 md:flex-row md:flex-wrap md:items-end">
      <div className="flex-1 min-w-[180px]">
        <label className="label">Search</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z" />
            </svg>
          </span>
          <input
            className="input pl-9"
            placeholder="Customer, requirement, contact…"
            value={filters.search}
            onChange={set('search')}
          />
        </div>
      </div>
      <div className="min-w-[140px]">
        <label className="label">Stage</label>
        <select className="input" value={filters.stage} onChange={set('stage')}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[130px]">
        <label className="label">Priority</label>
        <select className="input" value={filters.priority} onChange={set('priority')}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[150px]">
        <label className="label">Owner</label>
        <select className="input" value={filters.owner} onChange={set('owner')}>
          <option value="">All owners</option>
          <option value="mine">My opportunities</option>
        </select>
      </div>
      <div className="min-w-[160px]">
        <label className="label">Sort by</label>
        <select className="input" value={filters.sort} onChange={set('sort')}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">View</label>
        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          <button
            type="button"
            onClick={() => onViewChange('board')}
            className={`px-3 py-2 text-sm ${view === 'board' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => onViewChange('table')}
            className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}
          >
            Table
          </button>
        </div>
      </div>
    </div>
  );
}
