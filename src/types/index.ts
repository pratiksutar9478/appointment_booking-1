// ─── Domain models ───────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  phone?: string;
  email?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  /** ISO date string  YYYY-MM-DD */
  date: string;
  /** 24-h time string HH:MM */
  time: string;
  status: AppointmentStatus;
  messageChannel: MessageChannel;
  reminderSent: boolean;
  createdAt: string;
}

export type AppointmentStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type MessageChannel = "sms" | "whatsapp";

// ─── Form payloads ────────────────────────────────────────────────────────────

export interface BookingPayload {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  messageChannel: MessageChannel;
}
