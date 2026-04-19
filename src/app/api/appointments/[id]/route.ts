import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

// ─── GET /api/appointments/[id] ───────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const appt = await db.get("appointments", id);
    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ appointment: appt });
  } catch (err) {
    console.error("GET /api/appointments/[id]:", err);
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
  }
}

// ─── PUT /api/appointments/[id] ───────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const allowed = ["status", "reminderSent"] as const;
    const sanitised: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) sanitised[key] = updates[key];
    }
    if (Object.keys(sanitised).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const db = await getDB();
    await db.update("appointments", id, sanitised);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/appointments/[id]:", err);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
