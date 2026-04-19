import Link from "next/link";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: "✅",
    title: "Instant Confirmation",
    desc: "Receive a WhatsApp or SMS confirmation the moment you book — with doctor details, date, and time.",
  },
  {
    icon: "🔔",
    title: "Morning Reminder",
    desc: "On the day of your appointment, we automatically send you a reminder so you never miss it.",
  },
  {
    icon: "📲",
    title: "Rescheduling Alerts",
    desc: "If your doctor becomes unavailable, all affected patients are notified instantly with instructions to reschedule.",
  },
];

const steps = [
  { n: "01", title: "Select a Doctor",     desc: "Browse available specialists and pick the one that fits your needs." },
  { n: "02", title: "Choose a Time Slot",  desc: "Pick a convenient date and available time slot, with no double-booking." },
  { n: "03", title: "Enter Your Details",  desc: "Provide your name, phone, and preferred notification channel." },
  { n: "04", title: "Get Confirmed",       desc: "Receive an immediate WhatsApp or SMS confirmation with all your appointment info." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <span className="inline-block mb-4 text-5xl">🏥</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            Your Health,<br />Our Priority
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl max-w-xl mb-8">
            Book appointments with top doctors in minutes and receive instant
            WhatsApp or SMS confirmations — zero paperwork, zero waiting.
          </p>
          <Link
            href="/book"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:bg-blue-50 transition-colors"
          >
            Book Appointment Now →
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Smart Communication, Built In
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            From booking to the day of your appointment, our automated messaging
            system keeps you informed every step of the way.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-blue-50 rounded-2xl p-7 flex flex-col items-start"
              >
                <span className="text-4xl mb-4">{icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <span className="text-3xl font-extrabold text-blue-200">{n}</span>
                <h3 className="text-base font-bold text-gray-900 mt-2 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-12">
            <Link
              href="/book"
              className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Book Your Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-blue-900 text-blue-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>🏥 <span className="font-semibold text-white">AppointCare</span> — Hospital Appointment & Messaging System</p>
          <p className="mt-1 text-xs text-blue-400">
            Powered by Next.js · Firebase · Twilio
          </p>
        </div>
      </footer>
    </div>
  );
}
