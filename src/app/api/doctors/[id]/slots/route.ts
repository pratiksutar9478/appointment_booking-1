import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

const ALL_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

/**
 * GET /api/doctors/[id]/slots?date=YYYY-MM-DD
 * Returns the time slots still available for the given doctor on the given date.
 * Slots already booked (status=confirmed) are excluded.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date query param is required" }, { status: 400 });
    }

    const db = await getDB();
    const booked = await db.query("appointments", [
      ["doctorId", "==", id],
      ["date",     "==", date],
      ["status",   "==", "confirmed"],
    ]);

    const bookedTimes = new Set(booked.map((a) => a.time as string));
    const slots = ALL_SLOTS.filter((s) => !bookedTimes.has(s));

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("GET /api/doctors/[id]/slots:", err);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
