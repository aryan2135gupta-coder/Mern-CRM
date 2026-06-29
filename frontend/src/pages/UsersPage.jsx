import { Loader2, Mail, Shield, User, UserCheck, UserMinus, UserPlus, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { getApiError } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const UsersPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add User Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales_agent'
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users');
      setUsers(data.data.users);
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/users', form);
      showToast({ type: 'success', message: 'User created successfully' });
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'sales_agent' });
      loadUsers();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const updatedStatus = !user.isActive;
      const { data } = await api.patch(`/users/${user._id}`, { isActive: updatedStatus });
      
      setUsers((current) =>
        current.map((u) => (u._id === user._id ? { ...u, isActive: data.data.user.isActive } : u))
      );
      showToast({
        type: 'success',
        message: `User ${user.name} is now ${updatedStatus ? 'active' : 'inactive'}`
      });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      const { data } = await api.patch(`/users/${user._id}`, { role: newRole });
      setUsers((current) =>
        current.map((u) => (u._id === user._id ? { ...u, role: data.data.user.role } : u))
      );
      showToast({
        type: 'success',
        message: `Role of ${user.name} updated to ${newRole === 'admin' ? 'Admin' : 'Sales Agent'}`
      });
    } catch (err) {
      showToast({ type: 'error', message: getApiError(err) });
    }
  };

  // Filter users based on search query, role and status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus =
      statusFilter === 'active' ? u.isActive : statusFilter === 'inactive' ? !u.isActive : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title text-slate-950 dark:text-slate-50">User Management</h1>
          <p className="page-subtitle text-slate-500 dark:text-slate-400">Add and configure access credentials for agents and administrators.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filter panel */}
      <section className="panel p-4 dark:bg-slate-900/60 dark:border-slate-800">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="input-wrap dark:bg-slate-900 dark:border-slate-800">
            <User className="h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="dark:text-slate-200"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-select dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sales_agent">Sales Agent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </section>

      {error && <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-700 dark:text-rose-400">{error}</div>}

      {/* Table section */}
      <section className="panel overflow-hidden dark:bg-slate-900/60 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="table-head dark:text-slate-400">User Details</th>
                <th className="table-head dark:text-slate-400">Role</th>
                <th className="table-head dark:text-slate-400">Status</th>
                <th className="table-head dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No users found matching filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                          {userItem.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{userItem.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{userItem.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {userItem.role === 'admin' ? (
                          <Shield className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <User className="h-4 w-4 text-emerald-500" />
                        )}
                        <select
                          value={userItem.role}
                          onChange={(e) => handleChangeRole(userItem, e.target.value)}
                          className="rounded-md border border-slate-200 bg-transparent px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:text-slate-300"
                        >
                          <option value="sales_agent">Sales Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                          userItem.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${userItem.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleToggleActive(userItem)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                          userItem.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950 dark:text-rose-400 dark:hover:bg-rose-950/30'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {userItem.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Add New User</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure credentials for a new CRM user.</p>
              </div>
              <button
                className="inline-grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form className="space-y-4 p-5" onSubmit={handleCreateUser}>
              {formError && (
                <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
                <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm mt-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/50 transition">
                  <User className="h-4 w-4 text-slate-400" />
                  <input
                    name="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g., Sagar Verma"
                    className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
                <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm mt-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/50 transition">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="E.g., sagar@crm.com"
                    className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
                <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm mt-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/50 transition">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                System Role
                <select
                  name="role"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="form-select mt-1 w-full dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                >
                  <option value="sales_agent">Sales Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-secondary justify-center dark:bg-slate-900 dark:border-slate-800"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-primary justify-center bg-gradient-to-r from-indigo-600 to-violet-600" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
