import { createPool } from "./connection.mjs";

const expected = new Map([["ONDAS-BASE", 500], ["SUDOKU-200", 200], ["MUSIC-L01-PT", 100], ["MUSIC-L01-EN", 100]]);
const expectedTables = [
  "account", "activity_progress", "audit_events", "license_events", "licenses",
  "order_items", "orders", "payment_events", "payments", "product_editions",
  "products", "session", "skus", "user", "verification",
];
const pool = createPool();
try {
  const tables = await pool.query(
    "select tablename from pg_tables where schemaname='public' and tablename=any($1::text[]) order by tablename",
    [expectedTables],
  );
  if (tables.rowCount !== expectedTables.length) {
    const found = new Set(tables.rows.map((row) => row.tablename));
    const missing = expectedTables.filter((table) => !found.has(table));
    throw new Error(`Database verification failed: missing tables: ${missing.join(", ")}.`);
  }

  const result = await pool.query(
    `select s.code,s.price_minor,s.currency,s.active,e.locale,e.publishable
       from skus s
       join product_editions e on e.id=s.product_edition_id
      where s.code=any($1::text[])
      order by s.code`,
    [[...expected.keys()]],
  );
  if (result.rowCount !== expected.size) throw new Error("Catalog verification failed: missing SKU.");
  for (const row of result.rows) {
    if (row.price_minor !== expected.get(row.code) || row.currency !== "EUR" || !row.active || row.publishable) {
      throw new Error(`Catalog verification failed for ${row.code}.`);
    }
  }
  const locales = new Map(result.rows.map((row) => [row.code, row.locale]));
  if (locales.get("MUSIC-L01-PT") !== "pt-PT" || locales.get("MUSIC-L01-EN") !== "en") {
    throw new Error("Catalog verification failed: PT and EN editions are not independent.");
  }

  const constraints = await pool.query("select count(*)::int as count from pg_constraint where conname='order_items_single_digital_unit'");
  if (constraints.rows[0].count !== 1) throw new Error("Database constraints verification failed.");

  const commercialRows = await pool.query(
    "select (select count(*)::int from licenses) as licenses, (select count(*)::int from payments) as payments",
  );
  if (commercialRows.rows[0].licenses !== 0 || commercialRows.rows[0].payments !== 0) {
    throw new Error("Database verification failed: unexpected licenses or payments exist.");
  }

  console.log("Database verification passed (15 tables, 4 SKUs, 0 licenses, 0 payments).");
} finally {
  await pool.end();
}
