/**
 * Unified database access layer (Neon Postgres).
 *
 * SERVER-SIDE ONLY — never import this from a client component.
 */

import { neon } from "@neondatabase/serverless";

export type WhereOp = "==" | "!=" | ">=" | "<=" | ">" | "<";
export type WhereFilter = [field: string, op: WhereOp, value: any];

export interface DBRecord {
  id: string;
  createdAt: string;
  [key: string]: any;
}

export interface IDB {
  add(col: string, data: Record<string, any>): Promise<string>;
  get(col: string, id: string): Promise<DBRecord | null>;
  list(col: string, orderField?: string, orderDir?: "asc" | "desc"): Promise<DBRecord[]>;
  query(
    col: string,
    filters: WhereFilter[],
    orderField?: string,
    orderDir?: "asc" | "desc"
  ): Promise<DBRecord[]>;
  update(col: string, id: string, data: Record<string, any>): Promise<void>;
  del(col: string, id: string): Promise<void>;
}

const _g = globalThis as any;

function matchFilter(doc: DBRecord, [field, op, value]: WhereFilter): boolean {
  const v = doc[field];
  switch (op) {
    case "==": return v === value;
    case "!=": return v !== value;
    case ">=": return v >= value;
    case "<=": return v <= value;
    case ">":  return v > value;
    case "<":  return v < value;
    default:   return true;
  }
}

function sortDocs(
  docs: DBRecord[],
  field: string,
  dir: "asc" | "desc"
): DBRecord[] {
  return [...docs].sort((a, b) => {
    const av = a[field] ?? "";
    const bv = b[field] ?? "";
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function isNeonReady(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.length > 0 && /postgres(ql)?:\/\//i.test(url);
}

async function buildNeonDB(): Promise<IDB> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = neon(connectionString);

  // Single generic table keeps the existing collection-based app API unchanged.
  await sql`
    CREATE TABLE IF NOT EXISTS app_records (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection, id)
    );
  `;

  function normalize(row: any): DBRecord {
    const data = row.data ?? {};
    return {
      ...data,
      id: row.id,
      createdAt:
        data.createdAt ??
        (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()),
    };
  }

  return {
    async add(col, data) {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const payload = { ...data, id, createdAt };

      await sql`
        INSERT INTO app_records (collection, id, data, created_at)
        VALUES (${col}, ${id}, ${JSON.stringify(payload)}::jsonb, NOW())
      `;

      return id;
    },
    async get(col, id) {
      const rows = await sql`
        SELECT id, data, created_at
        FROM app_records
        WHERE collection = ${col} AND id = ${id}
        LIMIT 1
      `;
      if (!rows.length) return null;
      return normalize(rows[0]);
    },
    async list(col, orderField = "createdAt", orderDir = "desc") {
      const rows = await sql`
        SELECT id, data, created_at
        FROM app_records
        WHERE collection = ${col}
      `;
      const docs = rows.map(normalize);
      return sortDocs(docs, orderField, orderDir);
    },
    async query(col, filters, orderField, orderDir = "asc") {
      const rows = await sql`
        SELECT id, data, created_at
        FROM app_records
        WHERE collection = ${col}
      `;

      let docs = rows.map(normalize).filter((d) =>
        filters.every((f) => matchFilter(d, f))
      );

      if (orderField) docs = sortDocs(docs, orderField, orderDir);
      return docs;
    },
    async update(col, id, data) {
      const existing = await this.get(col, id);
      if (!existing) return;

      const merged = { ...existing, ...data, id };
      await sql`
        UPDATE app_records
        SET data = ${JSON.stringify(merged)}::jsonb
        WHERE collection = ${col} AND id = ${id}
      `;
    },
    async del(col, id) {
      await sql`
        DELETE FROM app_records
        WHERE collection = ${col} AND id = ${id}
      `;
    },
  };
}

export async function getDB(): Promise<IDB> {
  if (_g.__db_instance) return _g.__db_instance as IDB;

  if (isNeonReady()) {
    try {
      _g.__db_instance = await buildNeonDB();
    } catch (err) {
      console.error("Neon init failed:", err);
      throw err;
    }
  } else {
    throw new Error("DATABASE_URL is not configured. Set it in .env.local");
  }

  return _g.__db_instance as IDB;
}
