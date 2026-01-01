import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = {
    success: 'bg-green-900/90 border-green-500 text-green-400',
    error: 'bg-red-900/90 border-red-500 text-red-400',
    info: 'bg-blue-900/90 border-blue-500 text-blue-400',
  };
  const Icon = icons[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} animate-slide-in`}>
      <Icon className="w-5 h-5" />
      <span className="text-white">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}