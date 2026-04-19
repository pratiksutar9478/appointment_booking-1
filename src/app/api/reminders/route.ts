import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { sendMessageWithFallback, formatTwilioError } from "@/lib/twilio";
import { reminderMessage } from "@/lib/messages";

/**
 * POST /api/reminders
 * Sends a reminder to every CONFIRMED appointment that is within
 * the next 2 hours and has reminderSent === false.
 *
 * Secure this endpoint by adding an Authorization header check using
 * the CRON_SECRET env variable.  Set the header when calling from your
 * cron scheduler (Vercel Cron, GitHub Actions, etc.):
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Testing override:
 *   POST /api/reminders?testNow=true
 * This ignores the 2-hour window and sends reminders immediately for
 * all pending confirmed appointments.
 */
export async function POST(request: NextRequest) {
  // ── Security: verify cron secret ──────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const testNow = searchParams.get("testNow") === "true";
    const now = new Date();
    const windowMinutes = 120;

    const db = await getDB();

    console.log(
      `📅 Looking for pending reminders (testNow=${testNow}, window=${windowMinutes}m)`
    );

    const pending = await db.query("appointments", [
      ["status", "==", "confirmed"],
      ["reminderSent", "==", false],
    ]);

    const eligible = pending.filter((appt: any) => {
      if (testNow) return true;

      const appointmentDateTime = new Date(`${appt.date}T${appt.time}:00`);
      const diffMs = appointmentDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      return diffMinutes >= 0 && diffMinutes <= windowMinutes;
    });

    console.log(
      `Found ${pending.length} pending; ${eligible.length} eligible to send now.`
    );

    let sent   = 0;
    let failed = 0;
    const errors: string[] = [];

    await Promise.allSettled(
      eligible.map(async (appt) => {
        try {
          const body = reminderMessage(
            appt.patientName,
            appt.doctorName,
            appt.doctorSpecialty,
            appt.time,
            appt.messageChannel
          );
          await sendMessageWithFallback(body, appt.patientPhone, appt.messageChannel);
          await db.update("appointments", appt.id, { reminderSent: true });
          sent++;
        } catch (err: any) {
          failed++;
          const errorMessage = formatTwilioError(err);
          errors.push(`${appt.patientName}: ${errorMessage}`);
          console.error(`Reminder failed for ${appt.patientName}:`, errorMessage);
        }
      })
    );

    return NextResponse.json({
      success: true,
      testNow,
      windowMinutes,
      inspected: pending.length,
      eligible: eligible.length,
      sent,
      failed,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("POST /api/reminders:", err);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
