import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed z-[100] pointer-events-none flex flex-col gap-2.5 max-w-sm w-full bottom-20 inset-x-4 md:bottom-5 md:right-5 md:left-auto md:w-96">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] shadow-xl dark:shadow-2xl text-xs text-slate-800 dark:text-neutral-200 animate-slideUp transition-all"
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && (
                  <CheckCircle2 size={16} className="text-[#10B981] dark:text-[#3ECF8E]" />
                )}
                {isError && (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
                {!isSuccess && !isError && (
                  <Info size={16} className="text-blue-500" />
                )}
              </div>

              <div className="flex-1 font-semibold leading-relaxed">
                {t.message}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-0.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy if used outside provider
    return {
      showToast: (msg) => console.log('[Toast]', msg),
      toast: {
        success: (msg) => console.log('[Toast Success]', msg),
        error: (msg) => console.error('[Toast Error]', msg),
        info: (msg) => console.log('[Toast Info]', msg),
      },
    };
  }
  return context;
};
