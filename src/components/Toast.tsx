"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastContextType {
  showToast: (text: string, type?: ToastMessage["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const styles = {
    success: "bg-[var(--success)] text-[#080b12]",
    error: "bg-[var(--danger)] text-white",
    warning: "bg-[var(--warning)] text-[#080b12]",
    info: "bg-[var(--accent)] text-[#080b12]",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles[t.type]} px-4 py-3 rounded-xl shadow-lg text-sm font-bold mono tracking-wide animate-slide-in max-w-sm`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
