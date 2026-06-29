import {
  ArrowUpRight,
  Award,
  BarChart2,
  Briefcase,
  CheckCircle2,
  Clock,
  PhoneCall,
  TrendingUp,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const statusMeta = {
  new: { label: 'New', color: '#3b82f6', icon: Users },
  contacted: { label: 'Contacted', color: '#f59e0b', icon: PhoneCall },
  converted: { label: 'Converted', color: '#10b981', icon: CheckCircle2 },
  lost: { label: 'Lost', color: '#ef4444', icon: XCircle }
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get('/leads/stats');
        setStats(data.data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const pipelineChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.statusCounts).map(([key, value]) => ({
      name: statusMeta[key].label,
      value,
      color: statusMeta[key].color
    }));
  }, [stats]);

  const sourceChartData = useMemo(() => {
    if (!stats?.sourceCounts) return [];
    return stats.sourceCounts.map((item) => ({
      source: item.source.charAt(0).toUpperCase() + item.source.slice(1),
      leads: item.count
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <LoaderSpinner />
        <span className="text-sm font-medium">Assembling dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-5 text-sm text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}. Here's your workspace overview.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Conversion Rate:
          <span className="text-indigo-600 dark:text-indigo-400">{stats.conversionRate}%</span>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Leads */}
        <div className="panel p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalLeads}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-emerald-500 font-bold">Active</span>
            <span>pipeline tracker</span>
          </div>
        </div>

        {/* Card 2: Converted leads */}
        <div className="panel p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Converted Leads</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.statusCounts.converted}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.convertedThisMonth}</span>
            <span>converted this month</span>
          </div>
        </div>

        {/* Card 3: Added This Week */}
        <div className="panel p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">New This Week</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.addedThisWeek}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-500 font-bold">Incoming</span>
            <span>leads velocity</span>
          </div>
        </div>

        {/* Card 4: Contacted */}
        <div className="panel p-6 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contacted</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.statusCounts.contacted}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-amber-500 font-bold">Follow-ups</span>
            <span>scheduled or in-progress</span>
          </div>
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="panel p-6">
          <div className="mb-4">
            <h2 className="section-title">Pipeline Status</h2>
            <p className="section-subtitle">Lead distribution by qualification stage.</p>
          </div>
          <div className="h-72">
            {pipelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {pipelineChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">No status metrics.</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4.5 mt-2 text-xs font-semibold">
            {Object.entries(statusMeta).map(([key, item]) => (
              <span key={key} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label} ({stats.statusCounts[key] || 0})
              </span>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="panel p-6">
          <div className="mb-4">
            <h2 className="section-title">Lead Sources</h2>
            <p className="section-subtitle">Lead volume distribution across referral routes.</p>
          </div>
          <div className="h-72">
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="source" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} content={<CustomTooltip />} />
                  <Bar dataKey="leads" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">No source metrics.</div>
            )}
          </div>
        </div>
      </section>

      {/* Leaderboard and Recent Activity Grid */}
      <section className="grid gap-6 xl:grid-cols-[1fr_450px]">
        {/* Recent leads list */}
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="section-title">Recent Leads</h2>
              <p className="section-subtitle">Latest active additions to the workspace.</p>
            </div>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentLeads && stats.recentLeads.length > 0 ? (
              stats.recentLeads.map((lead) => (
                <div key={lead._id} className="flex items-center justify-between py-4.5 transition-all">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold uppercase select-none text-xs">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-400">Agent</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{lead.assignedAgent?.name}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                        lead.status === 'converted'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : lead.status === 'lost'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : lead.status === 'contacted'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">No recent leads found.</div>
            )}
          </div>
        </div>

        {/* Leaderboard panel (Admin only) */}
        {isAdmin && (
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="section-title">Sales Performance</h2>
                <p className="section-subtitle">Lead conversion rate leaderboard.</p>
              </div>
              <Award className="h-5 w-5 text-indigo-500" />
            </div>

            <div className="space-y-5">
              {stats.agentPerformance && stats.agentPerformance.length > 0 ? (
                stats.agentPerformance.map((performance, idx) => (
                  <div key={performance._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold font-mono">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{performance.agent.name}</p>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{performance.total} leads assigned</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{performance.conversionRate}%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{performance.converted} converted</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">No performance records.</div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const LoaderSpinner = () => (
  <svg className="animate-spin h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{payload[0].name || payload[0].payload.source}</p>
        <p className="mt-1 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
          Leads: <span className="text-slate-900 dark:text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default DashboardPage;
