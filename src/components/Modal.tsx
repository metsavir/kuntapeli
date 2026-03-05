import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useLockScroll } from '../hooks/useLockScroll';
import './Modal.css';

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
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  return createPortal(
    <div
      className={`modal-overlay${closing ? ' modal-overlay--closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`modal${className ? ` ${className}` : ''}${closing ? ' modal--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
