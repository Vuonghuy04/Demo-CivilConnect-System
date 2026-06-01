import { AlertTriangle, ClipboardList, ExternalLink, Filter, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { RequestForm } from '../components/RequestForm';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';
import { categories, teams } from '../data/mockData';
import type { NewRequestInput, Priority, RequestStatus, ServiceRequest } from '../types';
import { formatDate, formatDateTime } from '../utils/format';

const statuses: RequestStatus[] = ['Draft', 'Open', 'Assigned', 'In Progress', 'Inspection Scheduled', 'Escalated', 'Resolved', 'Feedback Pending', 'Closed'];
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
}

function hasSharedTerms(a: string, b: string) {
  const aTerms = new Set(normalise(a).split(/\s+/).filter((term) => term.length > 4));
  return normalise(b)
    .split(/\s+/)
    .some((term) => aTerms.has(term));
}

function findDuplicate(input: NewRequestInput, requests: ServiceRequest[]) {
  return requests.find((request) => {
    const sameCategory = request.category === input.category;
    const locationOverlap = normalise(request.location).includes(normalise(input.location).slice(0, 10)) || normalise(input.location).includes(normalise(request.location).slice(0, 10));
    const subjectOverlap = hasSharedTerms(request.subject, input.subject) || hasSharedTerms(request.description, input.description);
    return sameCategory && (locationOverlap || subjectOverlap);
  });
}

export function ServiceRequests() {
  const { role, requests, visibleRequests, createRequest, showToast } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDuplicate, setPendingDuplicate] = useState<{ input: NewRequestInput; match: ServiceRequest } | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [team, setTeam] = useState('');
  const [dateWindow, setDateWindow] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setCreateOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const canCreate = role === 'Citizen' || role === 'Officer';

  const filteredRequests = useMemo(() => {
    const startDate = dateWindow ? Date.now() - Number(dateWindow) * 24 * 60 * 60 * 1000 : 0;

    return visibleRequests.filter((request) => {
      const text = `${request.id} ${request.subject} ${request.description} ${request.citizenName} ${request.location}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesCategory = !category || request.category === category;
      const matchesStatus = !status || request.status === status;
      const matchesPriority = !priority || request.priority === priority;
      const matchesTeam = !team || request.assignedTeam === team;
      const matchesDate = !dateWindow || new Date(request.createdDate).getTime() >= startDate;

      return matchesQuery && matchesCategory && matchesStatus && matchesPriority && matchesTeam && matchesDate;
    });
  }, [category, dateWindow, priority, query, status, team, visibleRequests]);

  const submitCreate = (input: NewRequestInput) => {
    const duplicate = findDuplicate(input, requests);
    if (duplicate) {
      setPendingDuplicate({ input, match: duplicate });
      return;
    }
    const request = createRequest(input);
    setCreateOpen(false);
    showToast('Service request created.');
    navigate(`/requests/${request.id}`);
  };

  const completeDuplicateFlow = (linkedRequestId?: string) => {
    if (!pendingDuplicate) {
      return;
    }
    const request = createRequest(pendingDuplicate.input, linkedRequestId);
    setPendingDuplicate(null);
    setCreateOpen(false);
    showToast(linkedRequestId ? `Request created and linked to ${linkedRequestId}.` : 'Request created as a separate case.');
    navigate(`/requests/${request.id}`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Service register</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">{role === 'Specialist Team Member' ? 'Assigned service requests' : 'Service requests'}</h2>
          <p className="mt-1 text-sm text-slate-600">Search, filter, create, triage, and open full service request records.</p>
        </div>
        {canCreate ? (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create request
          </button>
        ) : null}
      </section>

      <section className="panel p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="field-label">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="form-input pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, location, citizen, issue" />
            </div>
          </label>
          <label>
            <span className="field-label">Category</span>
            <select className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Status</span>
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Priority</span>
            <select className="form-input" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="">All priorities</option>
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Assigned team</span>
            <select className="form-input" value={team} onChange={(event) => setTeam(event.target.value)}>
              <option value="">All teams</option>
              {teams.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Created</span>
            <select className="form-input" value={dateWindow} onChange={(event) => setDateWindow(event.target.value)}>
              <option value="">Any date</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">{filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'}</h3>
            <p className="text-xs text-slate-500">Showing records available to the current role.</p>
          </div>
        </div>

        {filteredRequests.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">Citizen</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{request.subject}</p>
                        <p className="text-xs text-slate-500">{request.id} · {request.location}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{request.citizenName}</td>
                      <td className="px-4 py-3 text-slate-700">{request.category}</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={request.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{request.assignedTeam || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(request.createdDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800" to={`/requests/${request.id}`}>
                          Open
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {filteredRequests.map((request) => (
                <Link key={request.id} to={`/requests/${request.id}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{request.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.id} · {request.citizenName}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{request.location}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <PriorityBadge priority={request.priority} />
                    <span className="text-xs text-slate-500">{formatDateTime(request.createdDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState icon={ClipboardList} title="No requests match these filters" description="Clear or change the filters to see more service request records." />
          </div>
        )}
      </section>

      {createOpen ? (
        <Modal title={role === 'Citizen' ? 'Create service request' : 'Log service request'} description="Capture request details, attachments, contact preferences, and urgency." onClose={() => setCreateOpen(false)} size="lg">
          <RequestForm role={role} onSubmit={submitCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>
      ) : null}

      {pendingDuplicate ? (
        <Modal title="Potential duplicate detected" description="CivicConnect found a similar request. Link it for better case coordination or continue as a separate case." onClose={() => setPendingDuplicate(null)}>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{pendingDuplicate.match.id} · {pendingDuplicate.match.subject}</p>
                <p className="mt-1">{pendingDuplicate.match.location}</p>
                <p className="mt-1">Current status: {pendingDuplicate.match.status}. Created {formatDateTime(pendingDuplicate.match.createdDate)}.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="btn-secondary" onClick={() => completeDuplicateFlow()}>
              Continue separately
            </button>
            <button className="btn-primary" onClick={() => completeDuplicateFlow(pendingDuplicate.match.id)}>
              Link / Merge request
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
