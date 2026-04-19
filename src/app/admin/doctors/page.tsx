"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Doctor } from "@/types";

interface NewDoctorForm {
  name: string;
  specialty: string;
  phone: string;
  email: string;
}

const EMPTY_FORM: NewDoctorForm = { name: "", specialty: "", phone: "", email: "" };

export default function DoctorsPage() {
  const [doctors,   setDoctors]   = useState<Doctor[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<NewDoctorForm>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [toggling,  setToggling]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  async function loadDoctors() {
    const res  = await fetch("/api/doctors");
    const data = await res.json();
    setDoctors(data.doctors ?? []);
    setLoading(false);
  }

  useEffect(() => { loadDoctors(); }, []);

  // ── Add doctor ──────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.specialty.trim()) {
      toast.error("Name and specialty are required");
      return;
    }
    setSaving(true);
    const res  = await fetch("/api/doctors", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Doctor added successfully!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadDoctors();
    } else {
      toast.error(data.error ?? "Failed to add doctor");
    }
    setSaving(false);
  }

  // ── Toggle availability ─────────────────────────────────────────────────────
  async function toggleAvailability(doctor: Doctor) {
    const newAvailable = !doctor.available;

    if (!newAvailable) {
      const confirmed = window.confirm(
        `Marking Dr. ${doctor.name} as UNAVAILABLE will notify all affected patients via WhatsApp/SMS and mark their appointments as rescheduled.\n\nContinue?`
      );
      if (!confirmed) return;
    }

    setToggling(doctor.id);
    const res  = await fetch(`/api/doctors/${doctor.id}/availability`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ available: newAvailable }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message ?? "Availability updated");
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, available: newAvailable } : d))
      );
    } else {
      toast.error(data.error ?? "Failed to update");
    }
    setToggling(null);
  }

  // ── Delete doctor ───────────────────────────────────────────────────────────
  async function handleDelete(doctor: Doctor) {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This cannot be undone.`)) return;
    setDeleting(doctor.id);
    const res = await fetch(`/api/doctors/${doctor.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Doctor deleted");
      setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
    } else {
      toast.error("Failed to delete doctor");
    }
    setDeleting(null);
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? "✕ Cancel" : "+ Add Doctor"}
        </button>
      </div>

      {/* ── Add Doctor Form ──────────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl border border-blue-200 p-6 mb-6 shadow-sm"
        >
          <h2 className="font-semibold text-gray-800 mb-4">New Doctor</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { key: "name",      label: "Full Name",   required: true,  placeholder: "Priya Sharma" },
              { key: "specialty", label: "Specialty",   required: true,  placeholder: "Cardiologist" },
              { key: "phone",     label: "Phone",       required: false, placeholder: "+91 98765 43210" },
              { key: "email",     label: "Email",       required: false, placeholder: "dr.priya@hospital.com" },
            ] as const).map(({ key, label, required, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Add Doctor"}
            </button>
          </div>
        </form>
      )}

      {/* ── Doctors List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading doctors…</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No doctors yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;Add Doctor&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl">👨‍⚕️</div>
                  <div>
                    <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                    <p className="text-sm text-blue-600">{doctor.specialty}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    doctor.available
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {doctor.available ? "Available" : "Unavailable"}
                </span>
              </div>

              {doctor.phone && <p className="text-xs text-gray-400 mb-1">📞 {doctor.phone}</p>}
              {doctor.email && <p className="text-xs text-gray-400 mb-3">✉️ {doctor.email}</p>}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => toggleAvailability(doctor)}
                  disabled={toggling === doctor.id}
                  className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                    doctor.available
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {toggling === doctor.id
                    ? "Updating…"
                    : doctor.available
                    ? "Mark Unavailable"
                    : "Mark Available"}
                </button>
                <button
                  onClick={() => handleDelete(doctor)}
                  disabled={deleting === doctor.id}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  title="Delete doctor"
                >
                  {deleting === doctor.id ? "…" : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
