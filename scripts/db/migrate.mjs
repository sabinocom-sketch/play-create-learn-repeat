import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createPool } from "./connection.mjs";

const pool = createPool();
try {
  const client = await pool.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [17012026]);
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("Database migrations applied successfully.");
  } finally {
    await client.query("select pg_advisory_unlock($1)", [17012026]).catch(() => undefined);
    client.release();
  }
} finally {
  await pool.end();
}
