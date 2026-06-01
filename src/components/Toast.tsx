import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';

import { useAppData } from '../context/AppDataContext';

const toneStyles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const toneIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export function Toast() {
  const { toast, clearToast } = useAppData();

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(clearToast, 3600);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  if (!toast) {
    return null;
  }

  const Icon = toneIcons[toast.tone];

  return (
    <div className="fixed right-4 top-4 z-[60] max-w-sm">
      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-soft ${toneStyles[toast.tone]}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{toast.message}</p>
        <button className="ml-2 rounded p-1 hover:bg-white/60" onClick={clearToast} aria-label="Dismiss notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
