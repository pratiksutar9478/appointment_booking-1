"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Appointment, Doctor } from "@/types";

interface Stats {
  total: number;
  today: number;
  confirmed: number;
  rescheduled: number;
  cancelled: number;
  completed: number;
  totalDoctors: number;
  availableDoctors: number;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   "bg-green-100 text-green-700",
  completed:   "bg-blue-100 text-blue-700",
  rescheduled: "bg-yellow-100 text-yellow-700",
  cancelled:   "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [recent, setRecent]             = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      const [apptRes, doctorRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/doctors"),
      ]);
      const apptData   = await apptRes.json();
      const doctorData = await doctorRes.json();

      const appointments: Appointment[] = apptData.appointments ?? [];
      const doctors: Doctor[]           = doctorData.doctors ?? [];
      const todayStr = new Date().toISOString().split("T")[0];

      setStats({
        total:            appointments.length,
        today:            appointments.filter((a) => a.date === todayStr).length,
        confirmed:        appointments.filter((a) => a.status === "confirmed").length,
        rescheduled:      appointments.filter((a) => a.status === "rescheduled").length,
        cancelled:        appointments.filter((a) => a.status === "cancelled").length,
        completed:        appointments.filter((a) => a.status === "completed").length,
        totalDoctors:     doctors.length,
        availableDoctors: doctors.filter((d) => d.available).length,
      });
      setRecent(appointments.slice(0, 8));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="text-gray-400 text-lg">Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Appointments", value: stats!.total,            color: "bg-blue-600",  icon: "📅" },
          { label: "Today's Appointments", value: stats!.today,          color: "bg-indigo-600", icon: "🗓️" },
          { label: "Confirmed",           value: stats!.confirmed,       color: "bg-green-600", icon: "✅" },
          { label: "Rescheduled / Cancelled", value: stats!.rescheduled + stats!.cancelled, color: "bg-yellow-500", icon: "⚠️" },
          { label: "Completed",           value: stats!.completed,       color: "bg-teal-600",  icon: "🏁" },
          { label: "Total Doctors",       value: stats!.totalDoctors,    color: "bg-purple-600", icon: "👨‍⚕️" },
          { label: "Available Doctors",   value: stats!.availableDoctors, color: "bg-emerald-600", icon: "🟢" },
          { label: "Unavailable Doctors", value: stats!.totalDoctors - stats!.availableDoctors, color: "bg-red-500", icon: "🔴" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-xl text-white shrink-0`}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/appointments" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="font-semibold text-gray-800">Manage Appointments</p>
          <p className="text-xs text-gray-400 mt-1">View, update, and track all bookings</p>
        </Link>
        <Link href="/admin/doctors" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">👨‍⚕️</div>
          <p className="font-semibold text-gray-800">Manage Doctors</p>
          <p className="text-xs text-gray-400 mt-1">Add doctors and toggle availability</p>

        </Link>
        <Link href="/admin/reminders" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">🔔</div>
          <p className="font-semibold text-gray-800">Send Reminders</p>
          <p className="text-xs text-gray-400 mt-1">Broadcast today&apos;s morning reminders</p>
        </Link>
      </div>

      {/* ── Recent appointments ──────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-xs text-blue-600 hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  {["Patient", "Doctor", "Date", "Time", "Channel", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{a.patientName}</td>
                    <td className="px-5 py-3 text-gray-600">Dr. {a.doctorName}</td>
                    <td className="px-5 py-3 text-gray-600">{a.date}</td>
                    <td className="px-5 py-3 text-gray-600">{a.time}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{a.messageChannel}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
