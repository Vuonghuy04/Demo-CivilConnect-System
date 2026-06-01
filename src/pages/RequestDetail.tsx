import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  FileUp,
  Link as LinkIcon,
  MessageSquarePlus,
  Paperclip,
  Pencil,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AISuggestionPanel } from '../components/AISuggestionPanel';
import { Modal } from '../components/Modal';
import { RequestForm } from '../components/RequestForm';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { useAppData } from '../context/AppDataContext';
import { teams } from '../data/mockData';
import type { Attachment, Priority, RequestStatus } from '../types';
import { formatDateTime } from '../utils/format';

const statuses: RequestStatus[] = ['Open', 'Assigned', 'In Progress', 'Inspection Scheduled', 'Escalated', 'Resolved', 'Feedback Pending', 'Closed'];
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

export function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    role,
    currentUser,
    requests,
    appointments,
    updateRequest,
    addNote,
    addAttachment,
    createAppointment,
    showToast,
  } = useAppData();
  const request = requests.find((item) => item.id === id);
  const linkedRequest = request?.linkedRequestId ? requests.find((item) => item.id === request.linkedRequestId) : undefined;
  const relatedAppointment = appointments.find((appointment) => appointment.requestId === request?.id && appointment.status !== 'Cancelled');
  const [editOpen, setEditOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'Internal' | 'Citizen Visible'>('Internal');
  const [uploadName, setUploadName] = useState('');

  const visibleNotes = useMemo(() => {
    if (!request) {
      return [];
    }
    return role === 'Citizen' ? request.notes.filter((note) => note.visibility === 'Citizen Visible') : request.notes;
  }, [request, role]);

  if (!request) {
    return (
      <div className="space-y-4">
        <button className="btn-secondary" onClick={() => navigate('/requests')}>
          <ChevronLeft className="h-4 w-4" />
          Back to requests
        </button>
        <div className="panel p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-950">Request not found</h2>
          <p className="mt-2 text-sm text-slate-600">The selected request record is not available.</p>
        </div>
      </div>
    );
  }

  const canCitizenEdit = role === 'Citizen' && request.citizenId === currentUser.id && ['Draft', 'Open', 'Assigned'].includes(request.status);
  const canStaffAct = role === 'Officer' || role === 'Manager';
  const canSpecialistAct = role === 'Specialist Team Member';

  const submitCitizenEdit = (input: Parameters<typeof updateRequest>[1] & { subject?: string; description?: string }) => {
    updateRequest(
      request.id,
      {
        subject: input.subject,
        category: input.category,
        description: input.description,
        location: input.location,
        contactPreference: input.contactPreference,
        urgency: input.urgency,
      },
      'Request details updated',
      'Citizen updated open request details.',
    );
    setEditOpen(false);
    showToast('Request updated.');
  };

  const updateStatus = (status: RequestStatus) => {
    updateRequest(
      request.id,
      { status, escalated: status === 'Escalated' || request.escalated },
      'Status updated',
      `Status changed to ${status}.`,
    );
    showToast(`Status changed to ${status}.`);
  };

  const assignTeam = (team: string) => {
    updateRequest(
      request.id,
      {
        assignedTeam: team || undefined,
        assignedOfficer: request.assignedOfficer || currentUser.name,
        status: team ? 'Assigned' : request.status,
      },
      'Assignment updated',
      team ? `Case assigned to ${team}.` : 'Team assignment cleared.',
    );
    showToast('Assignment updated.');
  };

  const escalate = () => {
    updateRequest(request.id, { status: 'Escalated', escalated: true, priority: request.priority === 'Critical' ? 'Critical' : 'High' }, 'Case escalated', 'Case escalated for manager review.');
    showToast('Case escalated for manager review.', 'warning');
  };

  const sendBooking = () => {
    if (relatedAppointment) {
      showToast('An active appointment invitation already exists.', 'info');
      return;
    }
    createAppointment(request.id);
    showToast('Appointment booking link sent.');
  };

  const specialistAccept = () => {
    updateRequest(
      request.id,
      {
        assignedSpecialist: currentUser.name,
        assignedTeam: currentUser.department,
        status: 'In Progress',
      },
      'Case accepted',
      `${currentUser.name} accepted the assigned case.`,
    );
    showToast('Case accepted.');
  };

  const specialistResolve = () => {
    updateRequest(
      request.id,
      { status: 'Feedback Pending', escalated: false },
      'Issue resolved',
      'Specialist marked the issue resolved and opened feedback collection.',
    );
    showToast('Issue resolved. Feedback is now pending.');
  };

  const submitNote = () => {
    if (!noteText.trim()) {
      showToast('Add a note before saving.', 'warning');
      return;
    }
    addNote(request.id, noteText, noteVisibility);
    setNoteText('');
    showToast('Case note added.');
  };

  const uploadFile = () => {
    if (!uploadName.trim()) {
      showToast('Enter a file name for the upload.', 'warning');
      return;
    }
    const attachment: Attachment = {
      id: `att-${Date.now()}`,
      name: uploadName,
      type: uploadName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Image',
      size: 'Mock file',
      uploadedBy: currentUser.name,
    };
    addAttachment(request.id, attachment);
    setUploadName('');
    showToast('Attachment added.');
  };

  const handleQuickUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    addAttachment(request.id, {
      id: `att-${Date.now()}`,
      name: file.name,
      type: file.type || 'Attachment',
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      uploadedBy: currentUser.name,
    });
    showToast('Attachment uploaded.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            <ChevronLeft className="h-4 w-4" />
            Back to requests
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{request.subject}</h2>
          <p className="mt-1 text-sm text-slate-600">{request.id} · Created {formatDateTime(request.createdDate)} · Updated {formatDateTime(request.updatedDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title">Request Summary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{request.description}</p>
            </div>
            {canCitizenEdit ? (
              <button className="btn-secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit request
              </button>
            ) : null}
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Citizen</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{request.citizenName}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{request.category}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{request.location}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{request.channel}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact preference</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{request.contactPreference}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA due</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-950">{formatDateTime(request.slaDue)}</dd>
            </div>
          </dl>
        </div>

        <div className="panel p-5">
          <h2 className="section-title">Assignment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Officer</dt>
              <dd className="font-semibold text-slate-950">{request.assignedOfficer || 'Unassigned'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Team</dt>
              <dd className="font-semibold text-slate-950">{request.assignedTeam || 'Unassigned'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Specialist</dt>
              <dd className="font-semibold text-slate-950">{request.assignedSpecialist || 'Not accepted'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Linked request</dt>
              <dd className="font-semibold text-slate-950">
                {linkedRequest ? (
                  <Link to={`/requests/${linkedRequest.id}`} className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800">
                    <LinkIcon className="h-4 w-4" />
                    {linkedRequest.id}
                  </Link>
                ) : (
                  'None'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <AISuggestionPanel request={request} />

        <div className="panel p-4">
          <h2 className="section-title">Role Actions</h2>
          {canStaffAct ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label>
                <span className="field-label">Status</span>
                <select className="form-input" value={request.status} onChange={(event) => updateStatus(event.target.value as RequestStatus)}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Assigned team</span>
                <select className="form-input" value={request.assignedTeam || ''} onChange={(event) => assignTeam(event.target.value)}>
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </label>
              {role === 'Manager' ? (
                <label>
                  <span className="field-label">Priority override</span>
                  <select
                    className="form-input"
                    value={request.priority}
                    onChange={(event) =>
                      updateRequest(request.id, { priority: event.target.value as Priority }, 'Priority overridden', `Manager changed priority to ${event.target.value}.`)
                    }
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="flex flex-wrap items-end gap-2 md:col-span-2">
                <button className="btn-secondary" onClick={sendBooking}>
                  <CalendarPlus className="h-4 w-4" />
                  Send booking link
                </button>
                <button className="btn-secondary" onClick={escalate}>
                  <ShieldAlert className="h-4 w-4" />
                  Escalate case
                </button>
                {role === 'Manager' && request.escalated ? (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      updateRequest(request.id, { escalated: false, status: 'In Progress' }, 'Escalation cleared', 'Manager cleared escalation after review.');
                      showToast('Escalation cleared.');
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Clear escalation
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {canSpecialistAct ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={specialistAccept}>
                  <UserCheck className="h-4 w-4" />
                  Accept case
                </button>
                <button className="btn-secondary" onClick={specialistResolve}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark resolved
                </button>
                <label className="btn-secondary cursor-pointer">
                  <FileUp className="h-4 w-4" />
                  Upload file
                  <input type="file" className="sr-only" onChange={handleQuickUpload} />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label>
                  <span className="field-label">Mock file name</span>
                  <input className="form-input" value={uploadName} onChange={(event) => setUploadName(event.target.value)} placeholder="inspection-photo.jpg" />
                </label>
                <button className="btn-secondary self-end" onClick={uploadFile}>
                  Add file
                </button>
              </div>
            </div>
          ) : null}

          {role === 'Citizen' ? (
            <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Citizen view</p>
              <p className="mt-1">Track status, review appointment invitations, upload requested evidence, and submit feedback after resolution.</p>
              {relatedAppointment ? (
                <Link to="/appointments" className="mt-3 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-800">
                  Manage appointment
                  <CalendarPlus className="h-4 w-4" />
                </Link>
              ) : null}
              {canCitizenEdit ? (
                <button
                  className="mt-3 inline-flex items-center gap-2 font-semibold text-red-700 hover:text-red-800"
                  onClick={() => {
                    updateRequest(request.id, { status: 'Closed' }, 'Request withdrawn', 'Citizen withdrew the service request.');
                    showToast('Request withdrawn.', 'warning');
                  }}
                >
                  Withdraw request
                  <XCircle className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}

        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">Attachments</h2>
            <Paperclip className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4 space-y-2">
            {request.attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-950">{attachment.name}</p>
                <p className="mt-1 text-xs text-slate-500">{attachment.type} · {attachment.size} · Uploaded by {attachment.uploadedBy}</p>
              </div>
            ))}
            {!request.attachments.length ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No attachments have been added to this request.</p> : null}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="section-title">Case Notes</h2>
          {role !== 'Citizen' ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label>
                <span className="field-label">Add note</span>
                <textarea className="form-input min-h-24" value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Add investigation, triage, or citizen-visible update." />
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="sm:w-56">
                  <span className="field-label">Visibility</span>
                  <select className="form-input" value={noteVisibility} onChange={(event) => setNoteVisibility(event.target.value as 'Internal' | 'Citizen Visible')}>
                    <option value="Internal">Internal</option>
                    <option value="Citizen Visible">Citizen Visible</option>
                  </select>
                </label>
                <button className="btn-primary" onClick={submitNote}>
                  <MessageSquarePlus className="h-4 w-4" />
                  Save note
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {visibleNotes.map((note) => (
              <div key={note.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{note.actor}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{note.visibility}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{note.text}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(note.date)}</p>
              </div>
            ))}
            {!visibleNotes.length ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No notes are visible in this role view.</p> : null}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="section-title">Timeline & History</h2>
        <div className="mt-4">
          <Timeline entries={request.timeline} />
        </div>
      </section>

      {editOpen ? (
        <Modal title="Update request details" description="Citizens can update draft, open, or assigned requests before investigation starts." onClose={() => setEditOpen(false)} size="lg">
          <RequestForm
            role="Citizen"
            submitLabel="Save changes"
            initial={{
              subject: request.subject,
              category: request.category,
              description: request.description,
              location: request.location,
              contactPreference: request.contactPreference,
              urgency: request.urgency,
              attachments: request.attachments,
            }}
            onSubmit={(input) => submitCitizenEdit(input)}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
