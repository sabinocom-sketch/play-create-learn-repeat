import pg from "pg";

export function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required.");
  if (!/^postgres(?:ql)?:\/\//.test(value)) throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  return value;
}

export function createPool() {
  return new pg.Pool({ connectionString: requireDatabaseUrl(), max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
}
