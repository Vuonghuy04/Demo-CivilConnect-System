import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { appointments as appointmentSeed, auditLogs as auditSeed, feedback as feedbackSeed, serviceRequests as requestSeed, users } from '../data/mockData';
import type { Appointment, AuditLog, Attachment, CaseNote, Feedback, NewRequestInput, Priority, RequestStatus, Role, ServiceRequest, TimelineEntry, User } from '../types';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'warning' | 'info';
}

interface AppDataContextValue {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: User;
  users: User[];
  requests: ServiceRequest[];
  visibleRequests: ServiceRequest[];
  appointments: Appointment[];
  visibleAppointments: Appointment[];
  feedback: Feedback[];
  auditLogs: AuditLog[];
  toast?: ToastState;
  clearToast: () => void;
  showToast: (message: string, tone?: ToastState['tone']) => void;
  createRequest: (input: NewRequestInput, linkedRequestId?: string) => ServiceRequest;
  updateRequest: (id: string, patch: Partial<ServiceRequest>, timelineTitle?: string, timelineDescription?: string) => void;
  addNote: (requestId: string, text: string, visibility: CaseNote['visibility']) => void;
  addAttachment: (requestId: string, attachment: Attachment) => void;
  createAppointment: (requestId: string) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>, timelineDescription?: string) => void;
  submitFeedback: (caseId: string, rating: number, comments: string) => void;
  updateFeedback: (id: string, rating: number, comments: string) => void;
  deleteFeedback: (id: string) => void;
  addAudit: (action: string, target: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const nowIso = () => new Date().toISOString();

const formatSerial = (prefix: string, count: number) => `${prefix}-2026-${String(count).padStart(4, '0')}`;

const createTimeline = (title: string, description: string, actor: string): TimelineEntry => ({
  id: `tl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  date: nowIso(),
  title,
  description,
  actor,
});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('Citizen');
  const [requests, setRequests] = useState<ServiceRequest[]>(requestSeed);
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentSeed);
  const [feedback, setFeedback] = useState<Feedback[]>(feedbackSeed);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(auditSeed);
  const [toast, setToast] = useState<ToastState | undefined>();

  const currentUser = useMemo(() => users.find((user) => user.role === role) ?? users[0], [role]);

  const visibleRequests = useMemo(() => {
    if (role === 'Citizen') {
      return requests.filter((request) => request.citizenId === currentUser.id);
    }

    if (role === 'Specialist Team Member') {
      return requests.filter(
        (request) => request.assignedSpecialist === currentUser.name || request.assignedTeam === currentUser.department,
      );
    }

    return requests;
  }, [currentUser, requests, role]);

  const visibleAppointments = useMemo(() => {
    if (role === 'Citizen') {
      const requestIds = new Set(visibleRequests.map((request) => request.id));
      return appointments.filter((appointment) => requestIds.has(appointment.requestId));
    }

    if (role === 'Specialist Team Member') {
      return appointments.filter((appointment) => appointment.assignedSpecialist === currentUser.name);
    }

    return appointments;
  }, [appointments, currentUser, role, visibleRequests]);

  const showToast = (message: string, tone: ToastState['tone'] = 'success') => {
    setToast({ id: Date.now(), message, tone });
  };

  const clearToast = () => setToast(undefined);

  const addAudit = (action: string, target: string) => {
    setAuditLogs((logs) => [
      {
        id: `aud-${Date.now()}`,
        date: nowIso(),
        actor: currentUser.name,
        role: currentUser.role,
        action,
        target,
      },
      ...logs,
    ]);
  };

  const createRequest = (input: NewRequestInput, linkedRequestId?: string) => {
    const id = formatSerial('SR', requests.length + 151);
    const citizenName = role === 'Citizen' ? currentUser.name : input.citizenName || 'Walk-in Citizen';
    const citizenId = role === 'Citizen' ? currentUser.id : `walk-in-${Date.now()}`;
    const suggestedPriority: Priority = input.urgency === 'Critical' ? 'Critical' : input.category.includes('Roads') ? 'High' : input.urgency;
    const newRequest: ServiceRequest = {
      id,
      citizenId,
      citizenName,
      subject: input.subject,
      category: input.category,
      aiSuggestedCategory: input.category,
      aiSuggestedPriority: suggestedPriority,
      aiConfidence: 88,
      priority: input.urgency,
      urgency: input.urgency,
      status: 'Open',
      channel: role === 'Citizen' ? 'Web Portal' : 'Counter',
      createdDate: nowIso(),
      updatedDate: nowIso(),
      slaDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedOfficer: role === 'Officer' ? currentUser.name : undefined,
      description: input.description,
      location: input.location,
      linkedRequestId,
      contactPreference: input.contactPreference,
      attachments: input.attachments,
      timeline: [
        createTimeline(
          role === 'Citizen' ? 'Request submitted' : 'Request logged by officer',
          linkedRequestId ? `New request created and linked to ${linkedRequestId}.` : 'New service request created.',
          currentUser.name,
        ),
        createTimeline('AI triage completed', `Suggested ${input.category} with ${suggestedPriority} priority.`, 'CivicConnect AI'),
      ],
      notes: [],
      escalated: false,
    };

    setRequests((items) => [newRequest, ...items]);
    addAudit('Created service request', id);
    return newRequest;
  };

  const updateRequest = (id: string, patch: Partial<ServiceRequest>, timelineTitle?: string, timelineDescription?: string) => {
    setRequests((items) =>
      items.map((request) => {
        if (request.id !== id) {
          return request;
        }

        const nextTimeline =
          timelineTitle && timelineDescription
            ? [createTimeline(timelineTitle, timelineDescription, currentUser.name), ...request.timeline]
            : request.timeline;

        return {
          ...request,
          ...patch,
          updatedDate: nowIso(),
          timeline: nextTimeline,
        };
      }),
    );
    addAudit(timelineTitle || 'Updated service request', id);
  };

  const addNote = (requestId: string, text: string, visibility: CaseNote['visibility']) => {
    const note: CaseNote = {
      id: `note-${Date.now()}`,
      date: nowIso(),
      actor: currentUser.name,
      text,
      visibility,
    };

    setRequests((items) => items.map((request) => (request.id === requestId ? { ...request, notes: [note, ...request.notes], updatedDate: nowIso() } : request)));
    addAudit('Added case note', requestId);
  };

  const addAttachment = (requestId: string, attachment: Attachment) => {
    setRequests((items) =>
      items.map((request) =>
        request.id === requestId
          ? {
              ...request,
              attachments: [attachment, ...request.attachments],
              timeline: [createTimeline('Attachment uploaded', `${attachment.name} was added to the case.`, currentUser.name), ...request.timeline],
              updatedDate: nowIso(),
            }
          : request,
      ),
    );
    addAudit('Uploaded attachment', requestId);
  };

  const createAppointment = (requestId: string) => {
    const request = requests.find((item) => item.id === requestId);
    const newAppointment: Appointment = {
      id: formatSerial('APT', appointments.length + 45),
      requestId,
      recommendedSlot: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      alternativeSlots: [
        new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      ],
      officerNotes: 'Recommended slot generated from specialist availability.',
      citizenNotes: '',
      status: 'Invitation Sent',
      assignedSpecialist: request?.assignedSpecialist || 'Priya Nair',
    };

    setAppointments((items) => [newAppointment, ...items]);
    updateRequest(requestId, { status: 'Inspection Scheduled' }, 'Booking link sent', 'Appointment invitation sent to citizen.');
    addAudit('Created appointment invitation', requestId);
    return newAppointment;
  };

  const updateAppointment = (id: string, patch: Partial<Appointment>, timelineDescription?: string) => {
    const existing = appointments.find((appointment) => appointment.id === id);
    setAppointments((items) =>
      items.map((appointment) => (appointment.id === id ? { ...appointment, ...patch } : appointment)),
    );

    if (existing?.requestId && timelineDescription) {
      updateRequest(existing.requestId, {}, 'Appointment updated', timelineDescription);
    }
    addAudit('Updated appointment', id);
  };

  const submitFeedback = (caseId: string, rating: number, comments: string) => {
    const request = requests.find((item) => item.id === caseId);
    const entry: Feedback = {
      id: formatSerial('FDB', feedback.length + 8),
      caseId,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      rating,
      comments,
      dateSubmitted: nowIso(),
    };

    setFeedback((items) => [entry, ...items]);
    if (request) {
      updateRequest(caseId, { status: 'Closed' as RequestStatus }, 'Feedback submitted', 'Citizen feedback received and case closed.');
    }
    addAudit('Submitted feedback', caseId);
  };

  const updateFeedback = (id: string, rating: number, comments: string) => {
    setFeedback((items) => items.map((entry) => (entry.id === id ? { ...entry, rating, comments, dateSubmitted: nowIso() } : entry)));
    addAudit('Updated feedback', id);
  };

  const deleteFeedback = (id: string) => {
    const existing = feedback.find((entry) => entry.id === id);
    setFeedback((items) => items.filter((entry) => entry.id !== id));
    if (existing?.caseId) {
      updateRequest(existing.caseId, { status: 'Feedback Pending' }, 'Feedback removed', 'Citizen feedback was removed and the case returned to feedback pending.');
    }
    addAudit('Deleted feedback', id);
  };

  const value: AppDataContextValue = {
    role,
    setRole,
    currentUser,
    users,
    requests,
    visibleRequests,
    appointments,
    visibleAppointments,
    feedback,
    auditLogs,
    toast,
    clearToast,
    showToast,
    createRequest,
    updateRequest,
    addNote,
    addAttachment,
    createAppointment,
    updateAppointment,
    submitFeedback,
    updateFeedback,
    deleteFeedback,
    addAudit,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
