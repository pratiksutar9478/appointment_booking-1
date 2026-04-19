import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { sendMessageWithFallback, formatTwilioError, getToAddress } from "@/lib/twilio";
import { confirmationMessage } from "@/lib/messages";
import type { BookingPayload } from "@/types";

// ─── GET /api/appointments ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date   = searchParams.get("date");
    const status = searchParams.get("status");

    const db = await getDB();
    let appointments;
    if (date) {
      appointments = await db.query("appointments", [["date", "==", date]], "time", "asc");
    } else {
      appointments = await db.list("appointments", "createdAt", "desc");
    }

    if (status) {
      appointments = appointments.filter((a: any) => a.status === status);
    }

    return NextResponse.json({ appointments });
  } catch (err) {
    console.error("GET /api/appointments:", err);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// ─── POST /api/appointments ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: BookingPayload = await request.json();
    const {
      patientName, patientPhone, patientEmail,
      doctorId, doctorName, doctorSpecialty,
      date, time, messageChannel,
    } = body;

    if (!patientName || !patientPhone || !doctorId || !date || !time || !messageChannel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let normalizedPhone = "";
    try {
      normalizedPhone = getToAddress(patientPhone, "sms");
    } catch {
      return NextResponse.json(
        { error: "Invalid phone number. Use international format like +14155552671" },
        { status: 400 }
      );
    }

    const db = await getDB();
    const id = await db.add("appointments", {
      patientName,
      patientPhone: normalizedPhone,
      patientEmail: patientEmail ?? "",
      doctorId,
      doctorName,
      doctorSpecialty,
      date,
      time,
      status: "confirmed",
      messageChannel,
      reminderSent: false,
    });

    // Send confirmation message via Twilio
    let messageSent = false;
    let messageError = "";
    let messageFallbackUsed = false;
    let messageChannelUsed = messageChannel;
    try {
      const msgBody = confirmationMessage(
        patientName,
        doctorName,
        doctorSpecialty,
        date,
        time,
        messageChannel
      );
      const sendResult = await sendMessageWithFallback(msgBody, normalizedPhone, messageChannel);
      messageSent = true;
      messageFallbackUsed = sendResult.fallbackUsed;
      messageChannelUsed = sendResult.usedChannel;
    } catch (twilioErr: any) {
      messageError = formatTwilioError(twilioErr);
      console.error("Twilio error on confirmation:", messageError);
    }

    return NextResponse.json(
      {
        success: true,
        appointmentId: id,
        messageSent,
        messageError: messageError || undefined,
        messageFallbackUsed,
        messageChannelUsed,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/appointments:", err);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
