import Badge from './ui/Badge.jsx';
import { STAGE_STYLES, PRIORITY_STYLES, formatCurrency, formatDate } from '../constants.js';

export default function OpportunityCard({ opportunity, isOwner, onEdit, onDelete, onView }) {
  const o = opportunity;
  return (
    <div className="card flex flex-col gap-2 p-4 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onView(o)}
          className="text-left font-semibold text-slate-800 hover:text-brand-600"
        >
          {o.customerName}
        </button>
        <Badge className={PRIORITY_STYLES[o.priority]}>{o.priority}</Badge>
      </div>

      <p className="line-clamp-2 text-sm text-slate-600">{o.requirement}</p>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge className={STAGE_STYLES[o.stage]}>{o.stage}</Badge>
        <span className="font-medium text-slate-700">{formatCurrency(o.estimatedValue)}</span>
      </div>

      <div className="mt-1 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500">
        <div>Next follow-up: <span className="text-slate-700">{formatDate(o.nextFollowUpDate)}</span></div>
        <div className="flex items-center justify-between">
          <span>
            By <span className="font-medium text-slate-700">{o.owner?.name || 'Unknown'}</span>
            {isOwner && <span className="ml-1 text-brand-600">(you)</span>}
          </span>
          <span>{formatDate(o.createdAt)}</span>
        </div>
      </div>

      {/* Edit/Delete shown only to the owner; backend still enforces authorization. */}
      {isOwner && (
        <div className="mt-1 flex gap-2">
          <button onClick={() => onEdit(o)} className="btn-secondary flex-1 py-1.5 text-xs">
            Edit
          </button>
          <button onClick={() => onDelete(o)} className="btn-danger flex-1 py-1.5 text-xs">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
