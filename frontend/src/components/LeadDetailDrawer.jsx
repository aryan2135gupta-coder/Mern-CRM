import {
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  NotebookText,
  Phone,
  Sparkles,
  UserRound,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { getApiError } from '../api/client.js';

const statusClasses = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/10',
  contacted: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/10',
  converted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/10',
  lost: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/10'
};

const activityIcons = {
  created: CheckCircle2,
  updated: NotebookText,
  status_changed: Clock3,
  assigned: UserRound,
  note_updated: NotebookText,
  deleted: X
};

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex gap-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 p-3.5 bg-white/40 dark:bg-slate-900/30">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value || 'Not provided'}
      </p>
    </div>
  </div>
);

const LeadDetailDrawer = ({ leadId, onClose, onEdit }) => {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const loadLead = async () => {
      setLoading(true);
      setError('');
      setAiInsights(null);

      try {
        const { data } = await api.get(`/leads/${leadId}`);
        setLead(data.data.lead);
        setActivities(data.data.activities || []);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadLead();
  }, [leadId]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data } = await api.post(`/leads/${leadId}/tasks`, {
        title: newTaskTitle,
        dueDate: newTaskDueDate || undefined
      });
      setLead(data.data.lead);
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const { data } = await api.patch(`/leads/${leadId}/tasks/${taskId}`);
      setLead(data.data.lead);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { data } = await api.delete(`/leads/${leadId}/tasks/${taskId}`);
      setLead(data.data.lead);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    try {
      const { data } = await api.get(`/leads/${leadId}/ai-insights`);
      setAiInsights(data.data.insights);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <button className="hidden flex-1 sm:block outline-none" onClick={onClose} />
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 shadow-2xl animate-fade-in flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-6 py-4.5">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Lead Detail</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950 dark:text-white">{lead?.name || 'Loading lead details'}</h2>
          </div>
          <button 
            className="inline-grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            onClick={onClose}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 grid place-items-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <LoaderSpinner />
              <span className="font-semibold">Fetching lead activity...</span>
            </div>
          </div>
        ) : error ? (
          <div className="m-5 rounded-lg bg-rose-50 dark:bg-rose-950/20 p-4 border border-rose-100 dark:border-rose-950/30 text-sm text-rose-700 dark:text-rose-400">
            {error}
          </div>
        ) : (
          <div className="flex-1 space-y-6 p-6 overflow-y-auto">
            {/* Overview Panel */}
            <section className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">{lead.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    Source: <span className="capitalize font-bold text-indigo-600 dark:text-indigo-400">{lead.source || 'website'}</span>
                  </p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${statusClasses[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailRow icon={Mail} label="Email" value={lead.email} />
                <DetailRow icon={Phone} label="Phone" value={lead.phone} />
                <DetailRow icon={UserRound} label="Assigned Agent" value={lead.assignedAgent?.name} />
                <DetailRow icon={Calendar} label="Created Date" value={new Date(lead.createdAt).toLocaleString()} />
              </div>
            </section>

            {/* Notes Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="section-title">Conversation Notes</h3>
                <button className="btn-secondary h-8 text-xs font-bold" onClick={() => onEdit(lead)}>
                  Edit Lead
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 text-sm leading-6 text-slate-700 dark:text-slate-350 shadow-xs">
                {lead.notes ? (
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                ) : (
                  <p className="italic text-slate-400 dark:text-slate-500 font-medium">No notes have been added yet.</p>
                )}
              </div>
            </section>

            {/* Tasks / Reminders Section */}
            <section className="space-y-4">
              <h3 className="section-title">Tasks & Follow-ups</h3>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-xs space-y-4">
                
                {/* Task Input Form */}
                <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a follow-up task (e.g., Send proposal)..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-indigo-500 dark:text-slate-100"
                    title="Due Date"
                  />
                  <button className="btn-primary h-9 px-3.5 text-xs font-bold shrink-0">
                    Add
                  </button>
                </form>

                {/* Task List */}
                <div className="space-y-2.5">
                  {!lead.tasks || lead.tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic font-semibold">No pending tasks for this lead.</p>
                  ) : (
                    lead.tasks.map((task) => (
                      <div key={task._id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/40 animate-fade-in">
                        <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => handleToggleTask(task._id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className={`text-sm font-semibold transition-all ${task.isCompleted ? 'line-through text-slate-450 dark:text-slate-550' : 'text-slate-800 dark:text-slate-200'}`}>
                              {task.title}
                            </span>
                            {task.dueDate && (
                              <p className={`text-[10px] font-bold mt-0.5 ${task.isCompleted ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 p-1 transition-colors"
                          title="Delete task"
                        >
                          <X className="h-4 w-4 shrink-0" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* AI Insights Section */}
            <section className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="section-title flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-violet-500 animate-pulse shrink-0" />
                  AI Lead Analysis
                </h3>
                {aiInsights && !loadingAi && (
                  <button onClick={fetchAiInsights} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Re-Analyze
                  </button>
                )}
              </div>
              
              <div className="rounded-xl border border-violet-100 dark:border-violet-950 bg-gradient-to-br from-violet-50/50 to-indigo-50/30 dark:from-violet-950/10 dark:to-indigo-950/10 p-5 shadow-xs">
                {loadingAi ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gemini is analyzing lead notes...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4">
                    {/* Score Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lead Temperature:</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        aiInsights.score === 'hot' ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50' :
                        aiInsights.score === 'warm' ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50' :
                        'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                      }`}>
                        {aiInsights.score}
                      </span>
                    </div>
                    {/* Summary */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Summary</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{aiInsights.summary}</p>
                    </div>
                    {/* Next Steps */}
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Recommended Next Step</h4>
                      <p className="text-sm text-indigo-650 dark:text-indigo-350 font-semibold">{aiInsights.nextSteps}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Use Google Gemini AI to analyze conversation history and qualify this lead.</p>
                    <button onClick={fetchAiInsights} className="btn-primary h-8 px-4 text-xs font-bold">
                      Analyze with Gemini
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="section-title">Activity Logs</h3>
              <div className="space-y-4.5 pl-1.5">
                {activities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-850 p-6 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                    No activity recorded yet.
                  </div>
                ) : (
                  activities.map((activity, idx) => {
                    const Icon = activityIcons[activity.type] || Clock3;
                    return (
                      <div key={activity._id} className="flex gap-4 relative">
                        {/* Connecting line */}
                        {idx !== activities.length - 1 && (
                          <span className="absolute top-8 left-[18px] bottom-[-22px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 z-10">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1 pb-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-150">{activity.message}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            {activity.user?.name || 'System'} &bull; {new Date(activity.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
};

const LoaderSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default LeadDetailDrawer;
