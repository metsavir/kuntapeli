import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useLockScroll } from '../hooks/useLockScroll';
import './HelpModal.css';

interface ModalProps {
  onClose: () => void;
  className?: string;
  showClose?: boolean;
  children: ReactNode;
}

export function Modal({
  onClose,
  className,
  showClose = true,
  children,
}: ModalProps) {
  useLockScroll();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
