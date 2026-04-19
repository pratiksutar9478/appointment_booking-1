import { format } from "date-fns";
import type { MessageChannel } from "@/types";

const HOSPITAL_NAME  = process.env.HOSPITAL_NAME  ?? "Gharda Hospital";
const HOSPITAL_PHONE = process.env.HOSPITAL_PHONE ?? "+1-800-HOSPITAL";

// ─── Message templates ────────────────────────────────────────────────────────

export function confirmationMessage(
  patientName: string,
  doctorName: string,
  specialty: string,
  date: string,
  time: string,
  channel: MessageChannel
): string {
  if (channel === "sms") {
    return "Your appointment has been CONFIRMED";
  }

  const d = format(new Date(`${date}T12:00:00`), "EEEE, MMMM d, yyyy");
  const t = format(new Date(`2000-01-01T${time}`), "h:mm a");

  return [
    `Dear ${patientName},`,
    ``,
    `Your appointment has been CONFIRMED!`,
    ``,
    `Doctor: Dr. ${doctorName} (${specialty})`,
    `Date: ${d}`,
    `Time: ${t}`,
    `Contact: ${HOSPITAL_PHONE}`,
    ``,
    `Thank you for choosing ${HOSPITAL_NAME}.`,
  ].join("\n");
}

export function reminderMessage(
  patientName: string,
  doctorName: string,
  specialty: string,
  time: string,
  channel: MessageChannel
): string {
  if (channel === "sms") {
    return `Reminder: Appointment today at ${time}. Dr. ${doctorName}.`;
  }

  const t = format(new Date(`2000-01-01T${time}`), "h:mm a");

  return [
    `Good morning, ${patientName}! ☀️`,
    ``,
    `Reminder: You have an appointment TODAY!`,
    ``,
    `🏥 Doctor : Dr. ${doctorName} (${specialty})`,
    `⏰ Time   : ${t}`,
    ``,
    `Please arrive 10 minutes early. See you soon!`,
    ``,
    `— ${HOSPITAL_NAME}`,
  ].join("\n");
}

export function reschedulingMessage(
  patientName: string,
  doctorName: string,
  date: string,
  channel: MessageChannel
): string {
  if (channel === "sms") {
    return `Appointment update: Dr. ${doctorName} unavailable on ${date}. Call ${HOSPITAL_PHONE} to reschedule.`;
  }

  const d = format(new Date(`${date}T12:00:00`), "EEEE, MMMM d, yyyy");

  return [
    `Dear ${patientName},`,
    ``,
    `⚠️  IMPORTANT: Appointment Update`,
    ``,
    `Dr. ${doctorName} is UNAVAILABLE on ${d} due to an emergency.`,
    `Your appointment has been affected.`,
    ``,
    `Please contact us to reschedule:`,
    `📞 ${HOSPITAL_PHONE}`,
    ``,
    `We sincerely apologise for the inconvenience.`,
    ``,
    `— ${HOSPITAL_NAME}`,
  ].join("\n");
}
