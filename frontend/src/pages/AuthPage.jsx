import { BarChart3, Loader2, LockKeyhole, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api, { getApiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const AuthPage = ({ mode }) => {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { isAuthenticated, login, signup } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales_agent'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignup) {
        await signup(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
      showToast({ type: 'success', message: isSignup ? 'Account created successfully' : 'Login successful' });
      navigate('/dashboard');
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      showToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[1fr_520px] transition-colors duration-300">
      {/* Left Banner Section */}
      <section className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.2),transparent_30%),linear-gradient(135deg,#030712,#0f172a_60%,#1e1b4b)]" />
        <div className="relative flex h-full flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-extrabold uppercase tracking-wider text-slate-50">MERN CRM</p>
              <p className="text-xs font-semibold text-indigo-300/80">Pipeline command center</p>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              Turn every lead into visible sales momentum.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 font-medium">
              Manage assignments, track activity logs, and monitor conversion health from one central workspace.
            </p>
          </div>

          <div className="grid max-w-md grid-cols-3 gap-4">
            {['New leads', 'Follow-ups', 'Conversions'].map((item, index) => (
              <div key={item} className="rounded-xl border border-white/5 bg-white/5 p-4.5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/10">
                <p className="text-3xl font-extrabold text-white">{[24, 12, 8][index]}</p>
                <p className="mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Login/Signup Panel */}
      <section className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-6 lg:hidden flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-extrabold uppercase tracking-wider text-slate-950 dark:text-white">MERN CRM</p>
            </div>
          </div>

          <div className="panel p-8 w-full shadow-lg dark:bg-slate-900/60 dark:border-slate-800 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{isSignup ? 'Create account' : 'Welcome back'}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                {isSignup ? 'Start with an admin or sales agent account.' : 'Use your CRM credentials to continue.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-rose-50 dark:bg-rose-950/20 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="field-label">
                  Full Name
                  <span className="input-wrap mt-1.5 dark:bg-slate-900 dark:border-slate-850">
                    <User className="h-4 w-4 text-slate-400" />
                    <input 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange} 
                      required 
                      placeholder="Your name" 
                      className="dark:text-slate-200"
                    />
                  </span>
                </label>
              )}

              <label className="field-label">
                Email Address
                <span className="input-wrap mt-1.5 dark:bg-slate-900 dark:border-slate-850">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@crm.com"
                    className="dark:text-slate-200"
                  />
                </span>
              </label>

              <label className="field-label">
                Password
                <span className="input-wrap mt-1.5 dark:bg-slate-900 dark:border-slate-850">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="dark:text-slate-200"
                  />
                </span>
              </label>

              {isSignup && (
                <label className="field-label">
                  System Role
                  <select 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange} 
                    className="form-select mt-1.5 dark:bg-slate-900 dark:border-slate-850 dark:text-slate-200"
                  >
                    <option value="sales_agent">Sales Agent</option>
                    <option value="admin">Admin (first account only)</option>
                  </select>
                </label>
              )}

              <button className="btn-primary w-full justify-center mt-6 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 font-bold hover:shadow-lg shadow-indigo-500/10" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                {isSignup ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
              <Link className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline" to={isSignup ? '/login' : '/signup'}>
                {isSignup ? 'Sign In' : 'Sign Up'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
