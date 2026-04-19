import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

// ─── GET /api/doctors ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDB();
    const doctors = await db.list("doctors", "createdAt", "desc");
    return NextResponse.json({ doctors });
  } catch (err) {
    console.error("GET /api/doctors:", err);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}

// ─── POST /api/doctors ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { name, specialty, phone, email } = await request.json();

    if (!name || !specialty) {
      return NextResponse.json({ error: "Name and specialty are required" }, { status: 400 });
    }

    const db = await getDB();
    const id = await db.add("doctors", {
      name:      name.trim(),
      specialty: specialty.trim(),
      phone:     phone?.trim() ?? "",
      email:     email?.trim() ?? "",
      available: true,
    });

    return NextResponse.json({ success: true, doctorId: id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/doctors:", err);
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}
