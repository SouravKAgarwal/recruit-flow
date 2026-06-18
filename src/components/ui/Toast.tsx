"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: <CheckCircle size={18} style={{ color: "var(--color-success)" }} />,
  error:   <XCircle    size={18} style={{ color: "var(--color-danger)" }} />,
  warning: <AlertCircle size={18} style={{ color: "var(--color-warning)" }} />,
  info:    <Info        size={18} style={{ color: "var(--color-primary)" }} />,
};

const borderColors = {
  success: "rgba(34,197,94,0.25)",
  error:   "rgba(239,68,68,0.25)",
  warning: "rgba(245,158,11,0.25)",
  info:    "rgba(99,102,241,0.25)",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
            style={{ borderColor: borderColors[t.type] }}
          >
            <div style={{ flexShrink: 0, marginTop: 1 }}>{icons[t.type]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--color-text)" }}>{t.title}</p>
              {t.message && (
                <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 2 }}>{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-muted)", padding: 2, flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
