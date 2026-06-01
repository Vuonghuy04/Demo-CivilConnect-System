import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, MessageSquarePlus, PlusCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { KpiCard } from '../components/KpiCard';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';
import type { ServiceRequest } from '../types';
import { formatDateTime, relativeAge } from '../utils/format';

function latestActivity(requests: ServiceRequest[]) {
  return requests
    .flatMap((request) => request.timeline.map((entry) => ({ ...entry, requestId: request.id, subject: request.subject })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

function MiniBarChart({ data }: { data: { label: string; value: number; tone: string }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { role, currentUser, requests, visibleRequests, visibleAppointments, feedback } = useAppData();
  const activeRequests = visibleRequests.filter((request) => !['Resolved', 'Feedback Pending', 'Closed'].includes(request.status));
  const escalated = requests.filter((request) => request.status === 'Escalated' || request.escalated);
  const pendingAppointments = visibleAppointments.filter((appointment) => !['Completed', 'Cancelled'].includes(appointment.status));
  const feedbackPending = visibleRequests.filter((request) => request.status === 'Feedback Pending');
  const slaAlerts = requests.filter((request) => new Date(request.slaDue).getTime() < Date.now() + 2 * 24 * 60 * 60 * 1000 && !['Closed', 'Resolved'].includes(request.status));
  const activity = latestActivity(role === 'Citizen' || role === 'Specialist Team Member' ? visibleRequests : requests);

  const managerChartData = [
    { label: 'Open', value: requests.filter((request) => request.status === 'Open').length, tone: 'bg-blue-500' },
    { label: 'Assigned', value: requests.filter((request) => request.status === 'Assigned').length, tone: 'bg-indigo-500' },
    { label: 'In progress', value: requests.filter((request) => request.status === 'In Progress' || request.status === 'Inspection Scheduled').length, tone: 'bg-cyan-500' },
    { label: 'Escalated', value: escalated.length, tone: 'bg-red-500' },
  ];

  const citizenQuickActions = role === 'Citizen';
  const staffQuickActions = role === 'Officer' || role === 'Specialist Team Member';
  const managerView = role === 'Manager';

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{role} workspace</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Good evening, {currentUser.name.split(' ')[0]}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Monitor service requests, appointments, feedback, and operational exceptions from one council service view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {citizenQuickActions || role === 'Officer' ? (
              <Link className="btn-primary" to="/requests?action=new">
                <PlusCircle className="h-4 w-4" />
                New request
              </Link>
            ) : null}
            <Link className="btn-secondary" to={managerView ? '/reports' : '/appointments'}>
              {managerView ? <TrendingUp className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              {managerView ? 'Open reports' : 'View appointments'}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={role === 'Citizen' ? 'My active requests' : 'Open requests'} value={activeRequests.length} helper="Currently waiting on action or investigation" icon={ClipboardList} tone="blue" />
        <KpiCard title="Escalated cases" value={managerView ? escalated.length : activeRequests.filter((request) => request.status === 'Escalated').length} helper="High-risk cases with manager attention" icon={AlertTriangle} tone="red" />
        <KpiCard title="Pending appointments" value={pendingAppointments.length} helper="Invitations, site visits, and inspections" icon={CalendarClock} tone="amber" />
        <KpiCard title="Feedback pending" value={feedbackPending.length} helper="Resolved cases awaiting citizen rating" icon={MessageSquarePlus} tone="green" />
      </section>

      {managerView ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">Manager KPI Snapshot</h2>
                <p className="mt-1 text-sm text-slate-600">Operational status mix across all active service requests.</p>
              </div>
              <Link to="/reports" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                Full report
              </Link>
            </div>
            <div className="mt-5">
              <MiniBarChart data={managerChartData} />
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="section-title">SLA Warnings</h2>
            <div className="mt-4 space-y-3">
              {slaAlerts.slice(0, 4).map((request) => (
                <Link key={request.id} to={`/requests/${request.id}`} className="block rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{request.id}</p>
                      <p className="mt-1 text-sm text-slate-600">{request.subject}</p>
                    </div>
                    <PriorityBadge priority={request.priority} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">SLA due {formatDateTime(request.slaDue)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">{staffQuickActions ? 'Work Queue' : 'Recent Activity'}</h2>
            <Link to="/requests" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(staffQuickActions ? activeRequests : visibleRequests).slice(0, 5).map((request) => (
              <Link key={request.id} to={`/requests/${request.id}`} className="block rounded-md border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{request.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">{request.id} · {request.category} · {relativeAge(request.createdDate)}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {pendingAppointments.slice(0, 4).map((appointment) => {
              const request = requests.find((item) => item.id === appointment.requestId);
              return (
                <Link key={appointment.id} to="/appointments" className="block rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{request?.subject || appointment.requestId}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(appointment.dateTime || appointment.recommendedSlot)}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                </Link>
              );
            })}
            {!pendingAppointments.length ? (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                No upcoming appointments require action.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="section-title">Activity Timeline</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activity.map((entry) => (
            <Link key={`${entry.requestId}-${entry.id}`} to={`/requests/${entry.requestId}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50">
              <p className="text-sm font-semibold text-slate-950">{entry.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{entry.subject}</p>
              <p className="mt-2 text-xs text-slate-500">{formatDateTime(entry.date)} · {entry.actor}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
