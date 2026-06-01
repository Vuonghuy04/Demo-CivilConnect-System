import { BarChart3, CheckCircle2, Download, FileText, LockKeyhole, MessageSquareText, Pencil, ShieldCheck, Star, Trash2, Users, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { KpiCard } from '../components/KpiCard';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';
import { users } from '../data/mockData';
import { formatDateTime } from '../utils/format';

function RatingPicker({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold ${
            rating === value ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setRating(value)}
          aria-label={`${value} star rating`}
        >
          <Star className={`h-4 w-4 ${rating >= value ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );
}

function ReportBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-slate-100">
            <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedbackReports() {
  const { role, currentUser, requests, visibleRequests, feedback, auditLogs, submitFeedback, updateFeedback, deleteFeedback, showToast } = useAppData();
  const [selectedCase, setSelectedCase] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [editingFeedbackId, setEditingFeedbackId] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComments, setEditComments] = useState('');

  const pendingFeedback = visibleRequests.filter(
    (request) => request.status === 'Feedback Pending' && !feedback.some((entry) => entry.caseId === request.id && entry.citizenId === currentUser.id),
  );

  const citizenFeedback = feedback.filter((entry) => entry.citizenId === currentUser.id);
  const averageRating = feedback.length ? (feedback.reduce((sum, entry) => sum + entry.rating, 0) / feedback.length).toFixed(1) : 'N/A';
  const escalated = requests.filter((request) => request.status === 'Escalated' || request.escalated);
  const aiOverrides = auditLogs.filter((entry) => entry.action.toLowerCase().includes('override') || entry.action.toLowerCase().includes('ai'));

  const categoryData = useMemo(() => {
    const counts = requests.reduce<Record<string, number>>((acc, request) => {
      acc[request.category] = (acc[request.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([label, value], index) => ({
      label,
      value,
      color: ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-cyan-500', 'bg-red-500'][index % 5],
    }));
  }, [requests]);

  const handleFeedbackSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCase) {
      showToast('Choose a resolved case before submitting feedback.', 'warning');
      return;
    }
    if (comments.trim().length < 8) {
      showToast('Add a short comment to help the council improve.', 'warning');
      return;
    }
    submitFeedback(selectedCase, rating, comments);
    setSelectedCase('');
    setRating(5);
    setComments('');
    showToast('Feedback submitted. Thank you.');
  };

  const startEditFeedback = (id: string, currentRating: number, currentComments: string) => {
    setEditingFeedbackId(id);
    setEditRating(currentRating);
    setEditComments(currentComments);
  };

  const saveFeedbackEdit = () => {
    if (!editingFeedbackId || editComments.trim().length < 8) {
      showToast('Add a short comment before saving feedback.', 'warning');
      return;
    }
    updateFeedback(editingFeedbackId, editRating, editComments);
    setEditingFeedbackId('');
    setEditComments('');
    showToast('Feedback updated.');
  };

  if (role === 'Citizen') {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Citizen feedback</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Feedback and case history</h2>
          <p className="mt-1 text-sm text-slate-600">Rate resolved service requests and review feedback already submitted.</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <form className="panel p-5" onSubmit={handleFeedbackSubmit}>
            <h3 className="section-title">Submit feedback</h3>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="field-label">Resolved case</span>
                <select className="form-input" value={selectedCase} onChange={(event) => setSelectedCase(event.target.value)}>
                  <option value="">Select case</option>
                  {pendingFeedback.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.id} · {request.subject}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="field-label">Rating</span>
                <div className="mt-2">
                  <RatingPicker rating={rating} setRating={setRating} />
                </div>
              </div>
              <label className="block">
                <span className="field-label">Comments</span>
                <textarea className="form-input min-h-32" value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Tell us what worked well or what could be improved." />
              </label>
              <button className="btn-primary" type="submit">
                Submit feedback
              </button>
            </div>
          </form>

          <div className="panel p-5">
            <h3 className="section-title">Feedback history</h3>
            <div className="mt-4 space-y-3">
              {citizenFeedback.map((entry) => {
                const request = requests.find((item) => item.id === entry.caseId);
                return (
                  <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/requests/${entry.caseId}`} className="font-semibold text-blue-700 hover:text-blue-800">
                        {entry.caseId} · {request?.subject}
                      </Link>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {entry.rating}/5
                      </span>
                    </div>
                    {editingFeedbackId === entry.id ? (
                      <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <RatingPicker rating={editRating} setRating={setEditRating} />
                        <textarea className="form-input min-h-24" value={editComments} onChange={(event) => setEditComments(event.target.value)} />
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" className="btn-secondary" onClick={() => setEditingFeedbackId('')}>
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <button type="button" className="btn-primary" onClick={saveFeedbackEdit}>
                            Save feedback
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700">{entry.comments}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(entry.dateSubmitted)}</p>
                    {editingFeedbackId !== entry.id ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="btn-secondary" onClick={() => startEditFeedback(entry.id, entry.rating, entry.comments)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            deleteFeedback(entry.id);
                            showToast('Feedback removed.', 'warning');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!citizenFeedback.length ? (
                <EmptyState icon={MessageSquareText} title="No feedback submitted yet" description="Resolved cases will appear here when feedback is available." />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const managerLike = role === 'Manager';

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{managerLike ? 'Management reporting' : 'Team reporting'}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">{managerLike ? 'KPI dashboard and reports' : 'Operational reporting'}</h2>
            <p className="mt-1 text-sm text-slate-600">Simple charts and tables for service volumes, SLA risk, escalations, and feedback quality.</p>
          </div>
          <button className="btn-secondary" onClick={() => showToast('Mock CSV export prepared.', 'info')}>
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Total requests" value={requests.length} helper="All channels in the service register" icon={BarChart3} tone="blue" />
        <KpiCard title="SLA alerts" value={requests.filter((request) => new Date(request.slaDue).getTime() < Date.now() + 2 * 24 * 60 * 60 * 1000).length} helper="Due within the next 48 hours" icon={ShieldCheck} tone="amber" />
        <KpiCard title="Escalations" value={escalated.length} helper="Manager attention required" icon={MessageSquareText} tone="red" />
        <KpiCard title="Avg rating" value={averageRating} helper="Citizen satisfaction feedback" icon={Star} tone="green" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <h3 className="section-title">Requests by category</h3>
          <div className="mt-5">
            <ReportBars data={categoryData} />
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="section-title">Feedback quality</h3>
          <div className="mt-5 grid gap-3">
            {feedback.map((entry) => (
              <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-950">{entry.caseId}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {entry.rating}/5
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{entry.comments}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="section-title">Escalations and SLA warnings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">SLA due</th>
                <th className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requests
                .filter((request) => request.escalated || request.priority === 'Critical' || request.status === 'Escalated')
                .map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3">
                      <Link to={`/requests/${request.id}`} className="font-semibold text-blue-700 hover:text-blue-800">
                        {request.id} · {request.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(request.slaDue)}</td>
                    <td className="px-4 py-3 text-slate-700">{request.assignedTeam || 'Unassigned'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {managerLike ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Audit events" value={auditLogs.length} helper="Recorded case and access events" icon={FileText} tone="blue" />
            <KpiCard title="AI records" value={aiOverrides.length} helper="Generated suggestions and manual overrides" icon={ShieldCheck} tone="amber" />
            <KpiCard title="Active roles" value={users.length} helper="Configured user role profiles" icon={Users} tone="green" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="panel overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="section-title">Manager audit log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {auditLogs.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(entry.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-950">{entry.actor}</td>
                        <td className="px-4 py-3 text-slate-700">{entry.role}</td>
                        <td className="px-4 py-3 text-slate-700">{entry.action}</td>
                        <td className="px-4 py-3 text-blue-700">{entry.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="panel p-5">
                <h3 className="section-title">Role and access overview</h3>
                <div className="mt-4 space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{user.department}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div>
                    <h3 className="section-title">Highest authority role</h3>
                    <p className="mt-2 text-sm text-slate-600">Managers hold final approval authority for escalations, status overrides, service reporting, and access governance review.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Manager override activity is recorded in the audit log for priority, status, and escalation decisions.
          </section>
        </>
      ) : null}
    </div>
  );
}
