import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global { var __pclrPostgresPool: Pool | undefined; }

function requiredDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required for PostgreSQL operations.");
  if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  return value;
}

export function getPool(): Pool {
  globalThis.__pclrPostgresPool ??= new Pool({ connectionString: requiredDatabaseUrl(), max: Number(process.env.DATABASE_POOL_MAX ?? 10), idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  return globalThis.__pclrPostgresPool;
}

export function getDb() { return drizzle({ client: getPool(), schema }); }
export type Database = ReturnType<typeof getDb>;
