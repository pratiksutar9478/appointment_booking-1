import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

// ─── GET /api/doctors/[id] ────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const doctor = await db.get("doctors", id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    return NextResponse.json({ doctor });
  } catch (err) {
    console.error("GET /api/doctors/[id]:", err);
    return NextResponse.json({ error: "Failed to fetch doctor" }, { status: 500 });
  }
}

// ─── PUT /api/doctors/[id] ────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const allowed = ["name", "specialty", "phone", "email"] as const;
    const sanitised: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) sanitised[key] = String(updates[key]).trim();
    }
    if (Object.keys(sanitised).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const db = await getDB();
    await db.update("doctors", id, sanitised);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/doctors/[id]:", err);
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

// ─── DELETE /api/doctors/[id] ─────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    await db.del("doctors", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/doctors/[id]:", err);
    return NextResponse.json({ error: "Failed to delete doctor" }, { status: 500 });
  }
}
