import { BrainCircuit, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useAppData } from '../context/AppDataContext';
import { categories } from '../data/mockData';
import type { Priority, ServiceRequest } from '../types';
import { PriorityBadge } from './StatusBadge';

const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

export function AISuggestionPanel({ request }: { request: ServiceRequest }) {
  const { role, updateRequest, showToast } = useAppData();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [category, setCategory] = useState(request.category);
  const [priority, setPriority] = useState<Priority>(request.priority);
  const [reason, setReason] = useState('');
  const canAct = role === 'Officer' || role === 'Manager';

  const applySuggestion = () => {
    updateRequest(
      request.id,
      { category: request.aiSuggestedCategory, priority: request.aiSuggestedPriority },
      'AI suggestion applied',
      `Category set to ${request.aiSuggestedCategory} and priority set to ${request.aiSuggestedPriority}.`,
    );
    showToast('AI suggestion applied to the case.');
  };

  const overrideSuggestion = () => {
    updateRequest(
      request.id,
      { category, priority },
      'AI suggestion overridden',
      reason || `Manual override set category to ${category} and priority to ${priority}.`,
    );
    setOverrideOpen(false);
    showToast('Manual triage override recorded.');
  };

  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="section-title">AI Triage Suggestion</h2>
            <p className="mt-1 text-sm text-slate-600">Confidence {request.aiConfidence}% based on request text, location, and duplicate patterns.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested category</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{request.aiSuggestedCategory}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested priority</p>
          <div className="mt-1">
            <PriorityBadge priority={request.aiSuggestedPriority} />
          </div>
        </div>
      </div>

      {canAct ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={applySuggestion}>
            <CheckCircle2 className="h-4 w-4" />
            Apply suggestion
          </button>
          <button className="btn-secondary" onClick={() => setOverrideOpen((value) => !value)}>
            <SlidersHorizontal className="h-4 w-4" />
            Manual override
          </button>
        </div>
      ) : null}

      {overrideOpen ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Override category</span>
              <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Override priority</span>
              <select className="form-input" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="field-label">Reason</span>
            <textarea className="form-input min-h-20" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why the AI recommendation was changed." />
          </label>
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" onClick={overrideSuggestion}>
              Save override
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
