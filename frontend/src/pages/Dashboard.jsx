import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../services/api.js';
import * as oppApi from '../services/opportunities.js';
import SummaryCards from '../components/SummaryCards.jsx';
import FilterBar from '../components/FilterBar.jsx';
import KanbanBoard from '../components/KanbanBoard.jsx';
import OpportunityTable from '../components/OpportunityTable.jsx';
import OpportunityForm from '../components/OpportunityForm.jsx';
import OpportunityDetail from '../components/OpportunityDetail.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';

const DEFAULT_FILTERS = { search: '', stage: '', priority: '', owner: '', sort: 'newest' };
const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, limit: PAGE_SIZE });
  const [view, setView] = useState('board');

  // Modal state: 'create' | 'edit' | 'view' | null
  const [modal, setModal] = useState(null);
  const [active, setActive] = useState(null); // opportunity being edited/viewed
  const [saving, setSaving] = useState(false);

  // Opportunity pending delete confirmation (null when the dialog is closed).
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef(null);

  const fetchData = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const { owner, ...rest } = currentFilters;
      const params = { ...rest, page: currentPage, limit: PAGE_SIZE };
      // Translate the UI-only "owner" filter into the backend's `mine` flag.
      if (owner === 'mine') params.mine = 'true';
      const data = await oppApi.listOpportunities(params);
      setOpportunities(data.items);
      setMeta({ total: data.total, pages: data.pages, limit: data.limit });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load opportunities'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Global pipeline stats (whole collection, independent of filters/pagination).
  const fetchStats = useCallback(async () => {
    try {
      setStats(await oppApi.getStats());
    } catch {
      // Non-critical: leave stats as-is if this fails.
    }
  }, []);

  // Debounce fetches when filters or page change (mainly for the search box).
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(filters, page), 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchData]);

  // Load summary stats on mount.
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Changing any filter resets back to the first page.
  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const closeModal = () => {
    setModal(null);
    setActive(null);
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await oppApi.createOpportunity(payload);
      toast.success('Opportunity created');
      closeModal();
      fetchData(filters, page);
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      await oppApi.updateOpportunity(active.id, payload);
      toast.success('Opportunity updated');
      closeModal();
      fetchData(filters, page);
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  // Opens the confirmation dialog; actual deletion happens in confirmDelete.
  const handleDelete = (opp) => setConfirmTarget(opp);

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await oppApi.deleteOpportunity(confirmTarget.id);
      toast.success('Opportunity deleted');
      setConfirmTarget(null);
      fetchData(filters, page);
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddActivity = async (text) => {
    setSaving(true);
    try {
      const updated = await oppApi.addActivity(active.id, text);
      setActive(updated);
      toast.success('Activity added');
      fetchData(filters, page);
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add activity'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (opp) => { setActive(opp); setModal('edit'); };
  const openView = (opp) => { setActive(opp); setModal('view'); };

  const isActiveOwner = active && active.owner?.id === user?.id;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Opportunity Pipeline</h1>
          <p className="text-sm text-slate-500">Shared across the team — you can edit only your own.</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          + New Opportunity
        </button>
      </div>

      <SummaryCards stats={stats} />

      <FilterBar filters={filters} onChange={handleFilterChange} view={view} onViewChange={setView} />

      {loading ? (
        <Spinner label="Loading opportunities…" />
      ) : error ? (
        <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}{' '}
          <button onClick={() => fetchData(filters)} className="font-medium underline">
            Retry
          </button>
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          message={
            filters.search || filters.stage || filters.priority || filters.owner
              ? 'Try clearing filters, or create a new opportunity.'
              : 'Get started by creating your first opportunity.'
          }
          action={
            <button onClick={() => setModal('create')} className="btn-primary">
              + New Opportunity
            </button>
          }
        />
      ) : view === 'board' ? (
        <KanbanBoard
          opportunities={opportunities}
          currentUserId={user?.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          onView={openView}
        />
      ) : (
        <OpportunityTable
          opportunities={opportunities}
          currentUserId={user?.id}
          onEdit={openEdit}
          onDelete={handleDelete}
          onView={openView}
        />
      )}

      {!loading && !error && opportunities.length > 0 && (
        <Pagination
          page={page}
          pages={meta.pages}
          total={meta.total}
          limit={meta.limit}
          onChange={setPage}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'edit' ? 'Edit Opportunity' : 'New Opportunity'}
        maxWidth="max-w-2xl"
      >
        <OpportunityForm
          initial={modal === 'edit' ? active : null}
          onSubmit={modal === 'edit' ? handleUpdate : handleCreate}
          onCancel={closeModal}
          submitting={saving}
        />
      </Modal>

      {/* View / detail modal */}
      <Modal
        open={modal === 'view'}
        onClose={closeModal}
        title={active?.customerName || 'Opportunity'}
        maxWidth="max-w-lg"
      >
        {active && (
          <OpportunityDetail
            opportunity={active}
            isOwner={isActiveOwner}
            onAddActivity={handleAddActivity}
            addingActivity={saving}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete opportunity?"
        message={`This will permanently delete "${confirmTarget?.customerName}". This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
