import { useState } from 'react';
import Badge from './ui/Badge.jsx';
import { STAGE_STYLES, PRIORITY_STYLES, formatCurrency, formatDate } from '../constants.js';

export default function OpportunityDetail({ opportunity, isOwner, onAddActivity, addingActivity }) {
  const o = opportunity;
  const [note, setNote] = useState('');

  const submitNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    onAddActivity(note.trim());
    setNote('');
  };

  const rows = [
    ['Contact', o.contactName || '—'],
    ['Email', o.contactEmail || '—'],
    ['Phone', o.contactPhone || '—'],
    ['Estimated value', formatCurrency(o.estimatedValue)],
    ['Next follow-up', formatDate(o.nextFollowUpDate)],
    ['Created by', `${o.owner?.name || 'Unknown'}${isOwner ? ' (you)' : ''}`],
    ['Created', formatDate(o.createdAt)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={STAGE_STYLES[o.stage]}>{o.stage}</Badge>
        <Badge className={PRIORITY_STYLES[o.priority]}>{o.priority} priority</Badge>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-500">Requirement</h4>
        <p className="text-slate-700">{o.requirement}</p>
      </div>

      {o.notes && (
        <div>
          <h4 className="text-sm font-semibold text-slate-500">Notes</h4>
          <p className="whitespace-pre-wrap text-slate-700">{o.notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-slate-200 pt-3">
        <h4 className="mb-2 text-sm font-semibold text-slate-500">
          Activity / follow-up history
        </h4>
        {o.activity?.length ? (
          <ul className="mb-3 space-y-2">
            {[...o.activity].reverse().map((a) => (
              <li key={a.id || a._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-700">{a.text}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDate(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-slate-400">No activity logged yet.</p>
        )}

        {/* Only the owner can append activity (backend enforces this too). */}
        {isOwner && (
          <form onSubmit={submitNote} className="flex gap-2">
            <input
              className="input"
              placeholder="Log a call, email, or update…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={addingActivity || !note.trim()}>
              {addingActivity ? 'Adding…' : 'Add'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
