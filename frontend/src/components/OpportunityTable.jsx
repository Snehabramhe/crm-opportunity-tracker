import Badge from './ui/Badge.jsx';
import { STAGE_STYLES, PRIORITY_STYLES, formatCurrency, formatDate } from '../constants.js';

export default function OpportunityTable({ opportunities, currentUserId, onEdit, onDelete, onView }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Requirement</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Follow-up</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {opportunities.map((o) => {
            const isOwner = o.owner?.id === currentUserId;
            return (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <button onClick={() => onView(o)} className="font-medium text-slate-800 hover:text-brand-600">
                    {o.customerName}
                  </button>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{o.requirement}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(o.estimatedValue)}</td>
                <td className="px-4 py-3"><Badge className={STAGE_STYLES[o.stage]}>{o.stage}</Badge></td>
                <td className="px-4 py-3"><Badge className={PRIORITY_STYLES[o.priority]}>{o.priority}</Badge></td>
                <td className="px-4 py-3 text-slate-600">{formatDate(o.nextFollowUpDate)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {o.owner?.name}
                  {isOwner && <span className="ml-1 text-xs text-brand-600">(you)</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {isOwner ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(o)} className="text-brand-600 hover:underline">Edit</button>
                      <button onClick={() => onDelete(o)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
