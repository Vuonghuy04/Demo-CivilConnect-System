import type { TimelineEntry } from '../types';
import { formatDateTime } from '../utils/format';

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="space-y-4">
      {[...entries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((entry) => (
          <li key={entry.id} className="relative pl-6">
            <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                <time className="text-xs text-slate-500">{formatDateTime(entry.date)}</time>
              </div>
              <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">By {entry.actor}</p>
            </div>
          </li>
        ))}
    </ol>
  );
}
