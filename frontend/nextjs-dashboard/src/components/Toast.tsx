'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500',
          icon: <CheckCircle className="w-5 h-5 text-white" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-500',
          icon: <XCircle className="w-5 h-5 text-white" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: <Info className="w-5 h-5 text-white" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl ${styles.bg} text-white animate-in slide-in-from-right-10 fade-in duration-300`}>
      <div className="shrink-0 p-1 bg-white/20 rounded-full">
        {styles.icon}
      </div>
      <p className="font-bold text-sm tracking-tight">{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
