import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';

import { categories } from '../data/mockData';
import type { Attachment, ContactPreference, NewRequestInput, Priority } from '../types';

interface RequestFormProps {
  onSubmit: (input: NewRequestInput) => void;
  onCancel: () => void;
  role: string;
  initial?: Partial<NewRequestInput>;
  submitLabel?: string;
}

const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const contactPreferences: ContactPreference[] = ['Email', 'Phone', 'SMS'];

export function RequestForm({ onSubmit, onCancel, role, initial, submitLabel = 'Submit request' }: RequestFormProps) {
  const [form, setForm] = useState<NewRequestInput>({
    citizenName: initial?.citizenName || '',
    subject: initial?.subject || '',
    category: initial?.category || '',
    description: initial?.description || '',
    location: initial?.location || '',
    contactPreference: initial?.contactPreference || 'Email',
    urgency: initial?.urgency || 'Medium',
    attachments: initial?.attachments || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isOfficerEntry = role !== 'Citizen';

  const attachmentSummary = useMemo(() => {
    if (!form.attachments.length) {
      return 'No attachments added';
    }
    return `${form.attachments.length} file${form.attachments.length === 1 ? '' : 's'} ready`;
  }, [form.attachments.length]);

  const update = (key: keyof NewRequestInput, value: string | Attachment[]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const attachments = files.map((file) => ({
      id: `local-${file.name}-${file.lastModified}`,
      name: file.name,
      type: file.type || 'Attachment',
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedBy: 'Current user',
    }));
    update('attachments', [...form.attachments, ...attachments]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (isOfficerEntry && !form.citizenName?.trim()) {
      next.citizenName = 'Enter the citizen name for officer-created requests.';
    }
    if (!form.subject.trim()) {
      next.subject = 'Enter a short subject.';
    }
    if (!form.category) {
      next.category = 'Choose a category.';
    }
    if (form.description.trim().length < 20) {
      next.description = 'Add at least 20 characters so staff can triage the issue.';
    }
    if (!form.location.trim()) {
      next.location = 'Enter the location or address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isOfficerEntry ? (
        <label className="block">
          <span className="field-label">Citizen name</span>
          <input className="form-input" value={form.citizenName} onChange={(event) => update('citizenName', event.target.value)} placeholder="e.g. Taylor Morgan" />
          {errors.citizenName ? <p className="mt-1 text-sm text-red-600">{errors.citizenName}</p> : null}
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Category</span>
          <select className="form-input" value={form.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? <p className="mt-1 text-sm text-red-600">{errors.category}</p> : null}
        </label>

        <label className="block">
          <span className="field-label">Urgency</span>
          <select className="form-input" value={form.urgency} onChange={(event) => update('urgency', event.target.value as Priority)}>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="field-label">Subject</span>
        <input className="form-input" value={form.subject} onChange={(event) => update('subject', event.target.value)} placeholder="Short summary of the issue" />
        {errors.subject ? <p className="mt-1 text-sm text-red-600">{errors.subject}</p> : null}
      </label>

      <label className="block">
        <span className="field-label">Description</span>
        <textarea
          className="form-input min-h-32"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="Describe what happened, when it occurs, and any safety concerns."
        />
        {errors.description ? <p className="mt-1 text-sm text-red-600">{errors.description}</p> : null}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Location</span>
          <input className="form-input" value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Address, landmark, or intersection" />
          {errors.location ? <p className="mt-1 text-sm text-red-600">{errors.location}</p> : null}
        </label>

        <label className="block">
          <span className="field-label">Contact preference</span>
          <select className="form-input" value={form.contactPreference} onChange={(event) => update('contactPreference', event.target.value as ContactPreference)}>
            {contactPreferences.map((preference) => (
              <option key={preference} value={preference}>
                {preference}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-center text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
          <Paperclip className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-slate-800">Add multiple attachments</span>
          <span>{attachmentSummary}</span>
          <input type="file" multiple className="sr-only" onChange={handleFiles} />
        </label>
        {form.attachments.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {form.attachments.map((attachment) => (
              <li key={attachment.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-900">{attachment.name}</span> · {attachment.size}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
