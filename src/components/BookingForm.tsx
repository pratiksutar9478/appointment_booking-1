"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type { Doctor, MessageChannel } from "@/types";

type Step = 1 | 2 | 3 | 4;

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Select Doctor" },
    { n: 2, label: "Choose Time" },
    { n: 3, label: "Your Details" },
    { n: 4, label: "Confirm" },
  ];
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      {steps.map(({ n, label }, idx) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                n < current
                  ? "bg-green-500 text-white"
                  : n === current
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {n < current ? "✓" : n}
            </div>
            <span className={`mt-1 text-xs whitespace-nowrap ${n === current ? "text-blue-600 font-medium" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-1 mt-[-12px] ${n < current ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingForm() {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep]                   = useState<Step>(1);
  const [doctors, setDoctors]             = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [selectedDate, setSelectedDate]   = useState("");
  const [selectedTime, setSelectedTime]   = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots]   = useState(false);

  const [patientName,    setPatientName]    = useState("");
  const [patientPhone,   setPatientPhone]   = useState("");
  const [patientEmail,   setPatientEmail]   = useState("");
  const [msgChannel,     setMsgChannel]     = useState<MessageChannel>("sms");

  const [submitting, setSubmitting]       = useState(false);

  // ── Derived dates ───────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  // ── Fetch available doctors ─────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => {
        setDoctors((data.doctors ?? []).filter((d: Doctor) => d.available));
        setLoadingDoctors(false);
      })
      .catch(() => { setLoadingDoctors(false); toast.error("Failed to load doctors"); });
  }, []);

  // ── Fetch slots when doctor + date are set ──────────────────────────────────
  const fetchSlots = useCallback(() => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    fetch(`/api/doctors/${selectedDoctor.id}/slots?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => { setAvailableSlots(data.slots ?? []); setLoadingSlots(false); })
      .catch(() => { setLoadingSlots(false); toast.error("Failed to load slots"); });
  }, [selectedDoctor, selectedDate]);

  useEffect(fetchSlots, [fetchSlots]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedDoctor) return;
    setSubmitting(true);
    try {
      const normalizedPhone = patientPhone.trim().replace(/[\s()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
        throw new Error("Enter a valid phone in international format, e.g. +14155552671");
      }

      const res = await fetch("/api/appointments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientPhone: normalizedPhone,
          patientEmail,
          doctorId:        selectedDoctor.id,
          doctorName:      selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialty,
          date:            selectedDate,
          time:            selectedTime,
          messageChannel:  msgChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      const qs = new URLSearchParams({
        id:        data.appointmentId,
        name:      patientName,
        doctor:    selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date:      selectedDate,
        time:      selectedTime,
        channel:   msgChannel,
        sent:      String(data.messageSent),
        messageError: data.messageError ?? "",
      });
      router.push(`/confirmation?${qs.toString()}`);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Format helper ───────────────────────────────────────────────────────────
  function fmt12(time: string) {
    return format(new Date(`2000-01-01T${time}`), "h:mm a");
  }

  // ── STEP 1 — Select Doctor ──────────────────────────────────────────────────
  if (step === 1) return (
    <div>
      <StepIndicator current={1} />
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose your doctor</h2>

      {loadingDoctors ? (
        <div className="text-center py-12 text-gray-400">Loading doctors…</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No doctors are currently available.</p>
          <p className="text-gray-400 text-sm mt-1">Please check back later or contact the hospital.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDoctor(doc); setStep(2); }}
              className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all bg-white group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">👨‍⚕️</div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700">Dr. {doc.name}</p>
                  <p className="text-sm text-blue-600">{doc.specialty}</p>
                </div>
              </div>
              {doc.phone && <p className="text-xs text-gray-400 mt-1">📞 {doc.phone}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── STEP 2 — Date & Time ────────────────────────────────────────────────────
  if (step === 2) return (
    <div>
      <StepIndicator current={2} />
      <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center gap-1">
        ← Change doctor
      </button>

      <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">👨‍⚕️</span>
        <div>
          <p className="font-semibold text-gray-900">Dr. {selectedDoctor!.name}</p>
          <p className="text-sm text-blue-600">{selectedDoctor!.specialty}</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
        <input
          type="date"
          min={today}
          max={maxDate}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
          {loadingSlots ? (
            <p className="text-gray-400 text-sm py-4">Loading available slots…</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-gray-500 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              No slots available on this date. Please choose another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    selectedTime === slot
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                  }`}
                >
                  {fmt12(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          disabled={!selectedDate || !selectedTime}
          onClick={() => setStep(3)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  // ── STEP 3 — Patient Details ────────────────────────────────────────────────
  if (step === 3) return (
    <div>
      <StepIndicator current={3} />
      <button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center gap-1">
        ← Change date / time
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
            <span className="ml-1 text-xs text-gray-400">(with country code, e.g. +91…)</span>
          </label>
          <input
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+91 98765 43210"
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
          <input
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">How should we contact you?</label>
          <div className="grid grid-cols-2 gap-3">
            {(["whatsapp", "sms"] as MessageChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setMsgChannel(ch)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                  msgChannel === ch
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                <span className="text-lg">{ch === "whatsapp" ? "💬" : "📱"}</span>
                <div className="text-left">
                  <p className="font-medium text-sm capitalize">{ch}</p>
                  <p className="text-xs text-gray-400">{ch === "whatsapp" ? "Recommended" : "Text message"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={!patientName.trim() || !patientPhone.trim()}
          onClick={() => setStep(4)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Review Booking →
        </button>
      </div>
    </div>
  );

  // ── STEP 4 — Confirm ────────────────────────────────────────────────────────
  return (
    <div>
      <StepIndicator current={4} />
      <button onClick={() => setStep(3)} className="text-sm text-blue-600 hover:underline mb-4 inline-flex items-center gap-1">
        ← Edit details
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Review your appointment</h2>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
        {[
          { label: "Doctor",          value: `Dr. ${selectedDoctor!.name}` },
          { label: "Specialty",       value: selectedDoctor!.specialty },
          { label: "Date",            value: format(new Date(`${selectedDate}T12:00:00`), "EEEE, MMMM d, yyyy") },
          { label: "Time",            value: fmt12(selectedTime) },
          { label: "Patient",         value: patientName },
          { label: "Phone",           value: patientPhone },
          { label: "Notification via",value: msgChannel === "whatsapp" ? "WhatsApp 💬" : "SMS 📱" },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <span className="text-sm text-gray-500 min-w-[130px]">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        A confirmation {msgChannel === "whatsapp" ? "WhatsApp message" : "SMS"} will be sent to {patientPhone}.
      </p>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Booking…" : "Confirm & Book Appointment ✅"}
        </button>
      </div>
    </div>
  );
}
