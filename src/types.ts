export type Role = 'Citizen' | 'Officer' | 'Specialist Team Member' | 'Manager';

export type RequestStatus =
  | 'Draft'
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Inspection Scheduled'
  | 'Escalated'
  | 'Resolved'
  | 'Feedback Pending'
  | 'Closed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type AppointmentStatus = 'Invitation Sent' | 'Recommended' | 'Confirmed' | 'Reschedule Requested' | 'Cancelled' | 'Completed';

export type ContactPreference = 'Email' | 'Phone' | 'SMS';

export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
  contact: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  actor: string;
}

export interface CaseNote {
  id: string;
  date: string;
  actor: string;
  text: string;
  visibility: 'Internal' | 'Citizen Visible';
}

export interface ServiceRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  subject: string;
  category: string;
  aiSuggestedCategory: string;
  aiSuggestedPriority: Priority;
  aiConfidence: number;
  priority: Priority;
  urgency: Priority;
  status: RequestStatus;
  channel: 'Web Portal' | 'Phone' | 'Counter' | 'Mobile App';
  createdDate: string;
  updatedDate: string;
  slaDue: string;
  assignedOfficer?: string;
  assignedTeam?: string;
  assignedSpecialist?: string;
  description: string;
  location: string;
  linkedRequestId?: string;
  contactPreference: ContactPreference;
  attachments: Attachment[];
  timeline: TimelineEntry[];
  notes: CaseNote[];
  escalated: boolean;
}

export interface Appointment {
  id: string;
  requestId: string;
  dateTime?: string;
  recommendedSlot: string;
  alternativeSlots: string[];
  officerNotes: string;
  citizenNotes: string;
  status: AppointmentStatus;
  assignedSpecialist: string;
}

export interface Feedback {
  id: string;
  caseId: string;
  citizenId: string;
  citizenName: string;
  rating: number;
  comments: string;
  dateSubmitted: string;
}

export interface AuditLog {
  id: string;
  date: string;
  actor: string;
  role: Role | 'System';
  action: string;
  target: string;
}

export interface NewRequestInput {
  citizenName?: string;
  subject: string;
  category: string;
  description: string;
  location: string;
  contactPreference: ContactPreference;
  urgency: Priority;
  attachments: Attachment[];
}
