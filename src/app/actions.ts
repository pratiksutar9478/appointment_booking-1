"use server";

import { neon } from "@neondatabase/serverless";

export async function getData() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = neon(connectionString);
  const data = await sql`SELECT NOW() AS server_time`;
  return data;
}
