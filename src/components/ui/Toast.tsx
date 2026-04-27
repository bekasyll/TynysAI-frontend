import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Module-level bridge so that non-React code (axios interceptors, Keycloak
 * callbacks) can show toasts without holding a React context. Populated by
 * ToastProvider on mount, cleared on unmount.
 */
let externalNotify: ((message: string, type: ToastType) => void) | null = null;

export function notifyToast(message: string, type: ToastType = 'info') {
  externalNotify?.(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    const timer = setTimeout(() => dismiss(id), 4000);
    timers.current.set(id, timer);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error = useCallback((m: string) => toast(m, 'error'), [toast]);
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast]);

  useEffect(() => {
    externalNotify = (msg, type) => toast(msg, type);
    return () => { externalNotify = null; };
  }, [toast]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} className="text-green-500 shrink-0" />,
    error: <XCircle size={16} className="text-red-500 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-yellow-500 shrink-0" />,
    info: <Info size={16} className="text-blue-500 shrink-0" />,
  };

  const border: Record<ToastType, string> = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${border[t.type]} p-4 animate-slide-up`}
          >
            {icons[t.type]}
            <p className="text-sm text-gray-700 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
