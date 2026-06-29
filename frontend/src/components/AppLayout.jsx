import { BarChart3, LayoutDashboard, LogOut, Menu, Moon, Sun, UserCog, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users }
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const visibleNavItems =
    user?.role === 'admin'
      ? [...navItems, { to: '/users', label: 'Users', icon: UserCog }]
      : navItems;

  const Sidebar = () => (
    <aside className="flex h-full flex-col border-r border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-950/90 backdrop-blur-md transition-all duration-300">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">MERN CRM</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Sales workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-4 space-y-4">
        <div className="px-2">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
          <p className="truncate text-xs font-medium text-slate-400 dark:text-slate-500">{user?.email}</p>
          <span className="mt-2.5 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 text-xs font-bold capitalize tracking-wide text-emerald-700 dark:text-emerald-400 border border-emerald-200/20">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/50 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-500" />
                Dark Mode
              </>
            )}
          </button>

          <button 
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/50 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-20">
        <Sidebar />
      </div>

      {/* Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] animate-fade-in">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80 px-6 backdrop-blur-md transition-colors duration-300">
          <button className="icon-button lg:hidden" onClick={() => setSidebarOpen((value) => !value)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Customer Relationship Management</p>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Track, qualify, and convert leads</p>
          </div>

          <div className="text-right flex items-center gap-4">
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs font-semibold capitalize text-slate-400 dark:text-slate-500">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase select-none border border-slate-200/10">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        
        <main className="flex-1 px-6 py-8 md:px-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
