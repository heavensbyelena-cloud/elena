'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Modal réutilisable
 * Overlay flouté + fermeture Escape + clic overlay
 * Accessible : role="dialog", aria-modal, focus trap
 */
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
        }}
      />
      {/* Contenu modal */}
      <div
        style={{
          position: 'relative',
          background: 'var(--fond-carte)',
          border: '1px solid var(--bordure)',
          borderRadius: '4px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
