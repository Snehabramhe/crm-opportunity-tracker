import { STAGES, STAGE_STYLES, formatCurrency } from '../constants.js';
import OpportunityCard from './OpportunityCard.jsx';

export default function KanbanBoard({ opportunities, currentUserId, onEdit, onDelete, onView }) {
  const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: [] }), {});
  opportunities.forEach((o) => {
    (byStage[o.stage] || (byStage[o.stage] = [])).push(o);
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-3">
      {STAGES.map((stage) => {
        const items = byStage[stage] || [];
        const stageValue = items.reduce((sum, o) => sum + (o.estimatedValue || 0), 0);
        return (
          <div key={stage} className="w-72 flex-shrink-0">
            <div className="mb-2 flex items-center justify-between rounded-lg px-1">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_STYLES[stage]}`}>
                {stage} · {items.length}
              </span>
              <span className="text-xs text-slate-500">{formatCurrency(stageValue)}</span>
            </div>
            <div className="flex min-h-[60px] flex-col gap-3 rounded-xl bg-slate-200/50 p-2">
              {items.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-slate-400">No opportunities</p>
              ) : (
                items.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opportunity={o}
                    isOwner={o.owner?.id === currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
