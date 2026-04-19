import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { sendMessageWithFallback, formatTwilioError } from "@/lib/twilio";
import { reschedulingMessage } from "@/lib/messages";

/**
 * PUT /api/doctors/[id]/availability
 * Body: { available: boolean }
 *
 * When marking a doctor unavailable:
 *  1. Updates the doctor document.
 *  2. Fetches all CONFIRMED future appointments for that doctor.
 *  3. Sends a rescheduling WhatsApp/SMS to each affected patient.
 *  4. Updates each appointment's status to "rescheduled".
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { available } = await request.json();

    if (typeof available !== "boolean") {
      return NextResponse.json({ error: '"available" must be a boolean' }, { status: 400 });
    }

    const db = await getDB();

    const doctor = await db.get("doctors", id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    await db.update("doctors", id, { available });

    let notifiedCount = 0;
    const errors: string[] = [];

    if (!available) {
      const today = new Date().toISOString().split("T")[0];

      const affected = await db.query("appointments", [
        ["doctorId", "==", id],
        ["status",   "==", "confirmed"],
        ["date",     ">=", today],
      ]);

      await Promise.allSettled(
        affected.map(async (appt) => {
          try {
            const msgBody = reschedulingMessage(
              appt.patientName,
              doctor.name,
              appt.date,
              appt.messageChannel
            );
            await sendMessageWithFallback(msgBody, appt.patientPhone, appt.messageChannel);
          } catch (twilioErr: any) {
            errors.push(`${appt.patientName}: ${formatTwilioError(twilioErr)}`);
          }
          await db.update("appointments", appt.id, { status: "rescheduled" });
          notifiedCount++;
        })
      );
    }

    return NextResponse.json({
      success: true,
      available,
      notifiedCount,
      errors: errors.length ? errors : undefined,
      message: available
        ? "Doctor is now available."
        : `Doctor marked unavailable. ${notifiedCount} patient(s) notified.`,
    });
  } catch (err) {
    console.error("PUT /api/doctors/[id]/availability:", err);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
