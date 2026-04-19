import Link from "next/link";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";

interface SearchParams {
  id?:        string;
  name?:      string;
  doctor?:    string;
  specialty?: string;
  date?:      string;
  time?:      string;
  channel?:   string;
  sent?:      string;
  messageError?: string;
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { name, doctor, specialty, date, time, channel, sent, messageError } = await searchParams;

  const formattedDate = date
    ? format(new Date(`${date}T12:00:00`), "EEEE, MMMM d, yyyy")
    : "—";
  const formattedTime = time
    ? format(new Date(`2000-01-01T${time}`), "h:mm a")
    : "—";
  const messageSent = sent === "true";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        {/* Success badge */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl shadow">
            ✅
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
        <p className="text-gray-500 mb-8">
          {messageSent
            ? `A confirmation ${channel === "whatsapp" ? "WhatsApp message" : "SMS"} has been sent to your phone.`
            : "Your appointment has been saved. (Messaging was unavailable — please note your details below.)"}
        </p>

        {!messageSent && messageError && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900">
            <p className="font-semibold">Delivery error</p>
            <p className="mt-1 break-words">{messageError}</p>
          </div>
        )}

        {/* Details card */}
        <div className="bg-white rounded-2xl shadow-md p-6 text-left space-y-3 mb-8">
          {[
            { label: "Patient",   value: name ?? "—" },
            { label: "Doctor",    value: doctor ? `Dr. ${doctor}` : "—" },
            { label: "Specialty", value: specialty ?? "—" },
            { label: "Date",      value: formattedDate },
            { label: "Time",      value: formattedTime },
            { label: "Sent via",  value: channel === "whatsapp" ? "WhatsApp 💬" : "SMS 📱" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-sm text-gray-400 min-w-[90px]">{label}</span>
              <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-sm text-blue-800">
          <strong>Reminder:</strong> You will receive an automatic reminder message on the morning of your appointment.
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/book"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Book Another
          </Link>
        </div>
      </main>
    </div>
  );
}
