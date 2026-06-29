import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-350 shadow-emerald-950/10'
  },
  error: {
    icon: XCircle,
    classes: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-950 dark:bg-rose-950/90 dark:text-rose-350 shadow-rose-950/10'
  },
  info: {
    icon: Info,
    classes: 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 shadow-slate-950/10'
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message }) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => removeToast(id), 3600);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    const handleSessionExpired = (event) => {
      showToast({
        type: 'error',
        message: event.detail || 'Session expired. Please login again.'
      });
    };

    window.addEventListener('crm:session-expired', handleSessionExpired);
    return () => window.removeEventListener('crm:session-expired', handleSessionExpired);
  }, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg ${style.classes}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
              <button className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => removeToast(toast.id)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
