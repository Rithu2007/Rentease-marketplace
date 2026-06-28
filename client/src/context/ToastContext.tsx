import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full sm:w-96 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
            
            // Border classes linked to HSL variables
            let borderClass = 'border-goldAccent/30';
            let iconColor = 'text-goldAccent';
            if (toast.type === 'success') {
              borderClass = 'border-tealAccent/30';
              iconColor = 'text-tealAccent';
            } else if (toast.type === 'error') {
              borderClass = 'border-[#ff5b5b]/30';
              iconColor = 'text-[#ff5b5b]';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#111118]/90 backdrop-blur-md border ${borderClass} shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}
              >
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                <div className="flex-1 text-xs text-white leading-relaxed font-sans font-medium">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
