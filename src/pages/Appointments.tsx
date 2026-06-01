import { CalendarCheck, CalendarClock, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';
import type { Appointment } from '../types';
import { formatDateTime } from '../utils/format';

type Tab = 'upcoming' | 'past';

function isPast(appointment: Appointment) {
  return appointment.status === 'Completed' || appointment.status === 'Cancelled' || new Date(appointment.dateTime || appointment.recommendedSlot).getTime() < Date.now();
}

export function Appointments() {
  const { role, requests, visibleAppointments, updateAppointment, showToast } = useAppData();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [citizenNotes, setCitizenNotes] = useState('');
  const [officerNoteEdits, setOfficerNoteEdits] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const upcoming = visibleAppointments.filter((appointment) => !isPast(appointment));
    const past = visibleAppointments.filter(isPast);
    return { upcoming, past };
  }, [visibleAppointments]);

  const appointments = grouped[tab];

  const confirmSlot = (appointment: Appointment, slot = appointment.recommendedSlot) => {
    updateAppointment(
      appointment.id,
      {
        dateTime: slot,
        status: 'Confirmed',
        citizenNotes: citizenNotes || appointment.citizenNotes,
      },
      `Appointment confirmed for ${formatDateTime(slot)}.`,
    );
    setCitizenNotes('');
    setReschedule(null);
    showToast('Appointment confirmed.');
  };

  const requestReschedule = () => {
    if (!reschedule || !selectedSlot) {
      showToast('Choose a slot before submitting the reschedule request.', 'warning');
      return;
    }
    updateAppointment(
      reschedule.id,
      {
        dateTime: selectedSlot,
        status: 'Reschedule Requested',
        citizenNotes,
      },
      `Citizen requested reschedule to ${formatDateTime(selectedSlot)}.`,
    );
    setReschedule(null);
    setSelectedSlot('');
    setCitizenNotes('');
    showToast('Reschedule request sent.');
  };

  const cancelAppointment = (appointment: Appointment) => {
    updateAppointment(appointment.id, { status: 'Cancelled' }, 'Appointment cancelled by citizen.');
    showToast('Appointment cancelled.', 'warning');
  };

  const completeAppointment = (appointment: Appointment) => {
    updateAppointment(appointment.id, { status: 'Completed' }, 'Site visit completed by specialist.');
    showToast('Appointment marked complete.');
  };

  const saveOfficerNote = (appointment: Appointment) => {
    const note = officerNoteEdits[appointment.id] || appointment.officerNotes;
    updateAppointment(appointment.id, { officerNotes: note }, 'Appointment note updated.');
    showToast('Appointment notes saved.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Inspection and booking workflow</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Appointments</h2>
            <p className="mt-1 text-sm text-slate-600">Citizens confirm invitations while staff coordinate inspections and site visits.</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(['upcoming', 'past'] as Tab[]).map((item) => (
              <button
                key={item}
                className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                  tab === item ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.38fr]">
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const request = requests.find((item) => item.id === appointment.requestId);
            const officerNote = officerNoteEdits[appointment.id] ?? appointment.officerNotes;

            return (
              <article key={appointment.id} className="panel p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{appointment.id}</h3>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <Link to={`/requests/${appointment.requestId}`} className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                      {appointment.requestId} · {request?.subject || 'Service request'}
                    </Link>
                    <p className="mt-2 text-sm text-slate-600">{request?.location}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-950">{formatDateTime(appointment.dateTime || appointment.recommendedSlot)}</p>
                    <p className="mt-1 text-slate-500">Assigned to {appointment.assignedSpecialist}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <CalendarClock className="h-4 w-4 text-blue-600" />
                      Recommended slot
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{formatDateTime(appointment.recommendedSlot)}</p>
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alternative slots</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {appointment.alternativeSlots.map((slot) => (
                          <button
                            key={slot}
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                            onClick={() => {
                              if (role === 'Citizen') {
                                setReschedule(appointment);
                                setSelectedSlot(slot);
                              } else {
                                updateAppointment(appointment.id, { dateTime: slot, status: 'Confirmed' }, `Appointment moved to ${formatDateTime(slot)}.`);
                                showToast('Alternative slot confirmed.');
                              }
                            }}
                          >
                            {formatDateTime(slot)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">Notes</p>
                    <div className="mt-3 grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Officer notes</p>
                        {role === 'Officer' ? (
                          <textarea className="form-input min-h-20" value={officerNote} onChange={(event) => setOfficerNoteEdits((items) => ({ ...items, [appointment.id]: event.target.value }))} />
                        ) : (
                          <p className="mt-1 text-sm text-slate-700">{appointment.officerNotes || 'No officer notes.'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Citizen notes</p>
                        <p className="mt-1 text-sm text-slate-700">{appointment.citizenNotes || 'No citizen notes.'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {role === 'Citizen' && tab === 'upcoming' ? (
                    <>
                      <button className="btn-primary" onClick={() => confirmSlot(appointment)}>
                        <CalendarCheck className="h-4 w-4" />
                        Confirm recommended
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setReschedule(appointment);
                          setSelectedSlot('');
                          setCitizenNotes(appointment.citizenNotes);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reschedule
                      </button>
                      <button className="btn-secondary" onClick={() => cancelAppointment(appointment)}>
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
                    </>
                  ) : null}

                  {role === 'Officer' && tab === 'upcoming' ? (
                    <>
                      <button className="btn-secondary" onClick={() => saveOfficerNote(appointment)}>
                        Save notes
                      </button>
                      <button className="btn-primary" onClick={() => confirmSlot(appointment, appointment.dateTime || appointment.recommendedSlot)}>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm booking
                      </button>
                    </>
                  ) : null}

                  {role === 'Specialist Team Member' && tab === 'upcoming' ? (
                    <button className="btn-primary" onClick={() => completeAppointment(appointment)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Complete site visit
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}

          {!appointments.length ? (
            <EmptyState
              icon={tab === 'upcoming' ? CalendarClock : Clock3}
              title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
              description="Appointments will appear here when booking invitations are created from a service request."
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h3 className="section-title">Booking Flow</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-md bg-blue-50 px-3 py-2 text-blue-800">Officer sends booking link from the request detail page.</p>
              <p className="rounded-md bg-green-50 px-3 py-2 text-green-800">Citizen confirms the recommended slot or requests an alternative.</p>
              <p className="rounded-md bg-slate-50 px-3 py-2 text-slate-700">Specialist completes the site visit and updates investigation notes.</p>
            </div>
          </div>
          <div className="panel p-5">
            <h3 className="section-title">Available Slots</h3>
            <div className="mt-4 space-y-2">
              {['2026-06-04T09:00:00', '2026-06-04T13:30:00', '2026-06-05T11:00:00', '2026-06-06T15:30:00'].map((slot) => (
                <div key={slot} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {formatDateTime(slot)}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {reschedule ? (
        <Modal title="Reschedule appointment" description="Choose a new slot and add notes for the officer or specialist." onClose={() => setReschedule(null)}>
          <div className="space-y-4">
            <div className="grid gap-2">
              {[reschedule.recommendedSlot, ...reschedule.alternativeSlots].map((slot) => (
                <button
                  key={slot}
                  className={`rounded-md border px-3 py-2 text-left text-sm font-semibold ${
                    selectedSlot === slot ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatDateTime(slot)}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="field-label">Citizen notes</span>
              <textarea className="form-input min-h-24" value={citizenNotes} onChange={(event) => setCitizenNotes(event.target.value)} placeholder="Add access notes, availability, or safety details." />
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="btn-secondary" onClick={() => setReschedule(null)}>
                Close
              </button>
              <button className="btn-primary" onClick={requestReschedule}>
                Request reschedule
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
