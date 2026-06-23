/**
 * Pagination control. Shows prev/next + page info and a result range.
 * `page` is 1-based; `pages` is the total page count from the API.
 */
export default function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="card flex flex-col items-center justify-between gap-3 p-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary px-3 py-1.5 text-sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <span className="text-sm text-slate-600">
          Page <span className="font-semibold">{page}</span> of {pages}
        </span>
        <button
          className="btn-secondary px-3 py-1.5 text-sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
