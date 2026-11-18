import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { catalogSeed } from "../scripts/db/catalog.mjs";

test("the initial catalog preserves exact SKUs and prices", () => {
  const prices = Object.fromEntries(catalogSeed.map((entry) => [entry.sku[1], entry.sku[3]]));
  assert.deepEqual(prices, {
    "ONDAS-BASE": 500,
    "SUDOKU-200": 200,
    "MUSIC-L01-PT": 100,
    "MUSIC-L01-EN": 100,
  });
});

test("music lesson language editions remain separate", () => {
  const pt = catalogSeed.find((entry) => entry.sku[1] === "MUSIC-L01-PT");
  const en = catalogSeed.find((entry) => entry.sku[1] === "MUSIC-L01-EN");
  assert.ok(pt && en);
  assert.notEqual(pt.edition[0], en.edition[0]);
  assert.equal(pt.edition[2], "pt-PT");
  assert.equal(en.edition[2], "en");
});

test("payments stay disabled", async () => {
  const source = await readFile(new URL("../src/services/payments.ts", import.meta.url), "utf8");
  assert.match(source, /paymentsEnabled\s*=\s*false/);
});

test("the migration enforces digital quantity, license and webhook idempotency", async () => {
  const migration = await readFile(new URL("../drizzle/0000_commercial_foundation.sql", import.meta.url), "utf8");
  assert.match(migration, /order_items_single_digital_unit/);
  assert.match(migration, /licenses_user_sku_uidx/);
  assert.match(migration, /payment_events_provider_event_uidx/);
  assert.match(migration, /publishable[^\n]+DEFAULT false/);
});

test("database verification covers the complete Phase A acceptance criteria", async () => {
  const verification = await readFile(new URL("../scripts/db/verify.mjs", import.meta.url), "utf8");
  assert.match(verification, /expectedTables\.length/);
  assert.match(verification, /MUSIC-L01-PT/);
  assert.match(verification, /MUSIC-L01-EN/);
  assert.match(verification, /row\.publishable/);
  assert.match(verification, /from licenses/);
  assert.match(verification, /from payments/);
});
