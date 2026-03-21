'use client';

import { useToast } from '@/context/ToastContext';

export default function Toast() {
  const { message, visible } = useToast();

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--fond-carte)',
        color: 'var(--accent)',
        border: '1px solid var(--bordure-hover)',
        padding: '12px 28px',
        fontSize: '0.8rem',
        letterSpacing: '0.1em',
        zIndex: 999,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        animation: visible ? 'toastIn 0.3s ease forwards' : 'none',
      }}
    >
      {message}
    </div>
  );
}
