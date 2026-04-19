import { format } from "date-fns";

const HOSPITAL_NAME  = process.env.HOSPITAL_NAME  ?? "City General Hospital";
const HOSPITAL_PHONE = process.env.HOSPITAL_PHONE ?? "+1-800-HOSPITAL";

// ─── Message templates ────────────────────────────────────────────────────────

export function confirmationMessage(
  patientName: string,
  doctorName: string,
  specialty: string,
  date: string,
  time: string
): string {
  void patientName;
  void doctorName;
  void specialty;
  void date;
  void time;
  void HOSPITAL_PHONE;
  void HOSPITAL_NAME;
  return "Your appointment has been CONFIRMED";
}

export function reminderMessage(
  patientName: string,
  doctorName: string,
  specialty: string,
  time: string
): string {
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
  date: string
): string {
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
