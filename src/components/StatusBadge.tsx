import type { AppointmentStatus, Priority, RequestStatus } from '../types';

const statusStyles: Record<RequestStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  Open: 'bg-blue-50 text-blue-700 ring-blue-200',
  Assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'In Progress': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  'Inspection Scheduled': 'bg-violet-50 text-violet-700 ring-violet-200',
  Escalated: 'bg-red-50 text-red-700 ring-red-200',
  Resolved: 'bg-green-50 text-green-700 ring-green-200',
  'Feedback Pending': 'bg-amber-50 text-amber-800 ring-amber-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const appointmentStyles: Record<AppointmentStatus, string> = {
  'Invitation Sent': 'bg-blue-50 text-blue-700 ring-blue-200',
  Recommended: 'bg-violet-50 text-violet-700 ring-violet-200',
  Confirmed: 'bg-green-50 text-green-700 ring-green-200',
  'Reschedule Requested': 'bg-amber-50 text-amber-800 ring-amber-200',
  Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  Completed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const priorityStyles: Record<Priority, string> = {
  Low: 'bg-slate-100 text-slate-700 ring-slate-200',
  Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
  High: 'bg-amber-50 text-amber-800 ring-amber-200',
  Critical: 'bg-red-50 text-red-700 ring-red-200',
};

export function StatusBadge({ status }: { status: RequestStatus | AppointmentStatus }) {
  const style = status in statusStyles ? statusStyles[status as RequestStatus] : appointmentStyles[status as AppointmentStatus];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priorityStyles[priority]}`}>{priority}</span>;
}
