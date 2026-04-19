"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ReminderResult {
  date:   string;
  sent:   number;
  failed: number;
  errors?: string[];
}

export default function RemindersPage() {
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<ReminderResult | null>(null);
  const [cronKey,  setCronKey]  = useState("");

  async function sendReminders() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/reminders", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cronKey ? { Authorization: `Bearer ${cronKey}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send reminders");
        return;
      }
      setResult(data);
      if (data.sent > 0) {
        toast.success(`${data.sent} reminder${data.sent > 1 ? "s" : ""} sent!`);
      } else {
        toast("No new reminders to send for today.", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Morning Reminders</h1>
      <p className="text-gray-500 mb-8">
        Send today&apos;s appointment reminders to all confirmed patients who have not yet received one.
        You can also automate this by calling{" "}
        <code className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded text-xs">POST /api/reminders</code>{" "}
        from a cron job each morning.
      </p>

      {/* ── How automation works ─────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-blue-900 mb-2">⚙️ Automating Reminders</h2>
        <p className="text-sm text-blue-800 mb-3">
          Schedule the endpoint below to run at 7–8 AM every day:
        </p>
        <pre className="bg-white border border-blue-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">
{`curl -X POST https://your-domain.com/api/reminders \\
     -H "Authorization: Bearer $CRON_SECRET"`}
        </pre>
        <p className="text-xs text-blue-600 mt-2">
          Works with Vercel Cron, GitHub Actions, cron-job.org, or any scheduler.
        </p>
      </div>

      {/* ── Manual trigger ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Send Manually (Today)</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cron Secret (leave blank if <code className="text-xs bg-gray-100 px-1 rounded">CRON_SECRET</code> is not set)
          </label>
          <input
            type="password"
            value={cronKey}
            onChange={(e) => setCronKey(e.target.value)}
            placeholder="your_cron_secret"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          onClick={sendReminders}
          disabled={sending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending reminders…" : "🔔 Send All Today's Reminders"}
        </button>
      </div>

      {/* ── Result ───────────────────────────────────────────────────────────── */}
      {result && (
        <div className={`mt-6 rounded-xl p-5 border ${result.failed > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>
          <h3 className="font-semibold mb-3">
            {result.failed > 0 ? "⚠️ Completed with errors" : "✅ All reminders sent!"}
          </h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Date:</span> <strong>{result.date}</strong></p>
            <p><span className="text-gray-500">Sent:</span> <strong className="text-green-700">{result.sent}</strong></p>
            {result.failed > 0 && (
              <p><span className="text-gray-500">Failed:</span> <strong className="text-red-600">{result.failed}</strong></p>
            )}
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">Failed patients:</p>
              <ul className="text-xs text-red-600 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Info box ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-500 space-y-1">
        <p>📌 Only patients with <strong>confirmed</strong> appointments for <strong>today</strong> and <code className="text-xs bg-gray-100 px-1 rounded">reminderSent = false</code> will receive a message.</p>
        <p>📌 Once sent, <code className="text-xs bg-gray-100 px-1 rounded">reminderSent</code> is set to <code className="text-xs bg-gray-100 px-1 rounded">true</code> to prevent duplicate messages.</p>
        <p>📌 Messages are sent via the patient&apos;s preferred channel (WhatsApp or SMS).</p>
      </div>
    </div>
  );
}
