"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px 0",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div style={{ padding: title ? "0 24px 24px" : "24px" }}>{children}</div>
      </div>
    </div>
  );
}
