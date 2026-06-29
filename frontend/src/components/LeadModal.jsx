import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  source: 'website',
  status: 'new',
  assignedAgent: '',
  notes: ''
};

const LeadModal = ({ agents, lead, onClose, onSaved }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(() => ({
    ...defaultForm,
    ...lead,
    assignedAgent: lead?.assignedAgent?._id || ''
  }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      source: form.source,
      status: form.status,
      notes: form.notes
    };

    if (isAdmin) {
      payload.assignedAgent = form.assignedAgent;
    }

    try {
      if (lead?._id) {
        await api.patch(`/leads/${lead._id}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      onSaved();
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4.5">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">{lead ? 'Edit Lead Details' : 'Add New Lead'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Keep client information structured and up-to-date.</p>
          </div>
          <button 
            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-855 bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Lead Name
              <input 
                className="form-input dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                placeholder="E.g., Ishaan Sen"
              />
            </label>

            <label className="field-label">
              Email Address
              <input 
                className="form-input dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200" 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                required 
                placeholder="ishaan@example.com"
              />
            </label>

            <label className="field-label">
              Phone Number
              <input 
                className="form-input dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200" 
                name="phone" 
                value={form.phone || ''} 
                onChange={handleChange} 
                placeholder="+91 99887 76655"
              />
            </label>

            <label className="field-label">
              Lead Source
              <input 
                className="form-input dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200" 
                name="source" 
                value={form.source || ''} 
                onChange={handleChange} 
                placeholder="E.g., LinkedIn, Referral, Google"
              />
            </label>

            <label className="field-label">
              Lead Status
              <select 
                className="form-select dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200" 
                name="status" 
                value={form.status} 
                onChange={handleChange}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </label>

            {isAdmin && (
              <label className="field-label">
                Assigned Agent
                <select
                  className="form-select dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                  name="assignedAgent"
                  value={form.assignedAgent}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="field-label">
            Conversation Notes
            <textarea
              className="form-textarea dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              rows="4"
              placeholder="Call summary, specific client requirements, pricing concerns..."
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 dark:border-slate-800 pt-5 sm:flex-row sm:justify-end">
            <button 
              type="button" 
              className="btn-secondary justify-center dark:bg-slate-900 dark:border-slate-800" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="btn-primary justify-center bg-gradient-to-r from-indigo-600 to-violet-600 font-bold" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {lead ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
