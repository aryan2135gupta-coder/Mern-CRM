import { Eye, Filter, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api, { getApiError } from '../api/client.js';
import LeadDetailDrawer from '../components/LeadDetailDrawer.jsx';
import LeadModal from '../components/LeadModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const statusClasses = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/10',
  contacted: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/10',
  converted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/10',
  lost: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/10'
};

const LeadsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: '', status: '', agent: '' });
  const [activeLead, setActiveLead] = useState(null);
  const [detailLeadId, setDetailLeadId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.agent && { agent: filters.agent })
    }),
    [filters, pagination.page, pagination.limit]
  );

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/leads', { params: queryParams });
      setLeads(data.data.leads);
      setPagination(data.pagination);
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [queryParams]);

  useEffect(() => {
    const loadAgents = async () => {
      if (!isAdmin) return;

      try {
        const { data } = await api.get('/users/agents');
        setAgents(data.data.agents);
      } catch {
        setAgents([]);
      }
    };

    loadAgents();
  }, [isAdmin]);

  const updateFilter = (name, value) => {
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const openCreateModal = () => {
    setActiveLead(null);
    setModalOpen(true);
  };

  const openEditModal = (lead) => {
    setActiveLead(lead);
    setModalOpen(true);
  };

  const openDetailDrawer = (lead) => {
    setDetailLeadId(lead._id);
  };

  const handleDelete = async (lead) => {
    const confirmed = window.confirm(`Are you sure you want to delete lead: ${lead.name}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/leads/${lead._id}`);
      showToast({ type: 'success', message: 'Lead deleted successfully' });
      loadLeads();
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      showToast({ type: 'error', message });
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await api.get('/leads/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast({ type: 'success', message: 'Leads exported successfully' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to export CSV: ' + getApiError(err) });
    }
  };

  const handleImportCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target.result;
      try {
        const { data } = await api.post('/leads/import', { csv: csvText });
        showToast({ type: 'success', message: data.message || 'Leads imported successfully' });
        loadLeads();
      } catch (err) {
        showToast({ type: 'error', message: 'Import failed: ' + getApiError(err) });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset file input
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage and track every lead across the sales team.' : 'Manage leads assigned to you.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="btn-secondary h-10 px-4 text-sm font-semibold" onClick={handleExportCSV} title="Download leads list as CSV">
            Export CSV
          </button>
          {isAdmin && (
            <label className="btn-secondary h-10 px-4 text-sm font-semibold cursor-pointer flex items-center gap-2" title="Upload leads list from CSV">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>
          )}
          <button className="btn-primary h-10 px-4 text-sm font-semibold" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <section className="panel p-4 dark:bg-slate-900/60 dark:border-slate-800">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <label className="input-wrap dark:bg-slate-950 dark:border-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search name, email, phone, source..."
              className="dark:text-slate-200"
            />
          </label>

          <label className="select-with-icon dark:bg-slate-950 dark:border-slate-800">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={filters.status} 
              onChange={(event) => updateFilter('status', event.target.value)}
              className="dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </label>

          {isAdmin && (
            <select
              className="form-select dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              value={filters.agent}
              onChange={(event) => updateFilter('agent', event.target.value)}
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      {error && <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/20">{error}</div>}

      {/* Leads Table */}
      <section className="panel overflow-hidden dark:bg-slate-900/60 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {['Lead Details', 'Source', 'Status', 'Assigned Agent', 'Created Date', 'Actions'].map((heading) => (
                  <th key={heading} className="table-head dark:text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                    Loading leads database...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No leads found matching current query.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{lead.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{lead.email}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{lead.phone || 'No phone number'}</p>
                      </div>
                    </td>
                    <td className="table-cell capitalize font-medium text-slate-700 dark:text-slate-350">{lead.source || 'website'}</td>
                    <td className="table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${statusClasses[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{lead.assignedAgent?.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{lead.assignedAgent?.email}</p>
                      </div>
                    </td>
                    <td className="table-cell font-medium text-slate-700 dark:text-slate-350">
                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="icon-button" onClick={() => openDetailDrawer(lead)} title="View lead details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="icon-button" onClick={() => openEditModal(lead)} title="Edit lead details">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button className="icon-button danger" onClick={() => handleDelete(lead)} title="Delete lead">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 px-5 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing page <strong className="text-slate-800 dark:text-slate-200">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{pagination.pages || 1}</strong> &middot;{' '}
            <strong className="text-slate-800 dark:text-slate-200">{pagination.total}</strong> total leads
          </span>
          <div className="flex gap-2.5">
            <button
              className="btn-secondary h-9 px-3.5"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
            >
              Previous
            </button>
            <button
              className="btn-secondary h-9 px-3.5"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <LeadModal
          agents={agents}
          lead={activeLead}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            showToast({
              type: 'success',
              message: activeLead ? 'Lead details updated successfully' : 'Lead created and registered successfully'
            });
            loadLeads();
          }}
        />
      )}

      {detailLeadId && (
        <LeadDetailDrawer
          leadId={detailLeadId}
          onClose={() => setDetailLeadId(null)}
          onEdit={(lead) => {
            setDetailLeadId(null);
            openEditModal(lead);
          }}
        />
      )}
    </div>
  );
};

export default LeadsPage;
