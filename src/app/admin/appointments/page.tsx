"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-green-100 text-green-700",
  completed:   "bg-blue-100 text-blue-700",
  rescheduled: "bg-yellow-100 text-yellow-700",
  cancelled:   "bg-red-100 text-red-700",
};

const ALL_STATUSES: AppointmentStatus[] = ["confirmed", "completed", "rescheduled", "cancelled"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate,   setFilterDate]   = useState("");
  const [updating,     setUpdating]     = useState<string | null>(null);

  async function loadAppointments() {
    setLoading(true);
    const url = filterDate
      ? `/api/appointments?date=${filterDate}`
      : "/api/appointments";
    const res  = await fetch(url);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAppointments(); }, [filterDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdating(id);
    const res = await fetch(`/api/appointments/${id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Status updated to ${status}`);
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } else {
      toast.error("Failed to update status");
    }
    setUpdating(null);
  }

  const filtered = filterStatus === "all"
    ? appointments
    : appointments.filter((a) => a.status === filterStatus);

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h1>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        {(filterDate || filterStatus !== "all") && (
          <button
            onClick={() => { setFilterDate(""); setFilterStatus("all"); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading appointments…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No appointments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {["Patient", "Phone", "Doctor", "Specialty", "Date", "Time", "Channel", "Reminder", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{a.patientName}</td>
                  <td className="px-4 py-3 text-gray-500">{a.patientPhone}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">Dr. {a.doctorName}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{a.doctorSpecialty}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.date}</td>
                  <td className="px-4 py-3 text-gray-600">{a.time}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{a.messageChannel}</td>
                  <td className="px-4 py-3 text-center">{a.reminderSent ? "✅" : "⏳"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status] ?? ""}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      disabled={updating === a.id}
                      onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
