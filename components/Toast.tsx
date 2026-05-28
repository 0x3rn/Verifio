'use client';

import React, { useState, useCallback } from 'react';

interface ToastItem {
  id: string;
  type: 'error' | 'success';
  title: string;
  message: string;
}

// Simple global-like state managed through React context pattern
let toastIdCounter = 0;
let globalAddToast: ((type: 'error' | 'success', title: string, message: string) => void) | null = null;
let globalRemoveToast: ((id: string) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: 'error' | 'success', title: string, message: string) => {
    const id = String(++toastIdCounter);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function Toast({ id, type, title, message, onDismiss }: ToastItem & { onDismiss: (id: string) => void }) {
  return (
    <div className={`toast toast--${type}`}>
      <div className={`toast__icon toast__icon--${type}`}>
        {type === 'error' ? (
          <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="toast__body">
        <div className="toast__title">{title}</div>
        <div className="toast__message">{message}</div>
      </div>
      <button onClick={() => onDismiss(id)} className="toast__close" aria-label="Dismiss">
        <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}