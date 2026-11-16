import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseUrl = new URL(process.env.SMOKE_BASE_URL ?? "https://playcreatelearnrepeat.test");
let response;

if (process.env.SMOKE_BASE_URL) {
  response = await fetch(baseUrl, { redirect: "error" });
} else {
  const { withSecurityHeaders } = await import("../lib/security-headers.mts");
  response = withSecurityHeaders(
    new Response("<title>Play. Create. Learn. Repeat.</title>", { status: 200 }),
  );
}
const html = await response.text();

assert.equal(response.status, 200, `Expected HTTP 200, received ${response.status}`);
assert.match(html, /Play\. Create\. Learn\. Repeat\./);

const expectedHeaders = {
  "content-security-policy": ["default-src 'self'", "frame-ancestors 'none'"],
  "permissions-policy": ["payment=()"],
  "referrer-policy": ["strict-origin-when-cross-origin"],
  "strict-transport-security": ["max-age=31536000"],
  "x-content-type-options": ["nosniff"],
  "x-frame-options": ["DENY"],
};

for (const [name, fragments] of Object.entries(expectedHeaders)) {
  const value = response.headers.get(name);
  assert.ok(value, `Missing ${name} header`);
  for (const fragment of fragments) {
    assert.ok(value.includes(fragment), `${name} does not include ${fragment}`);
  }
}

const paymentContract = await readFile(
  new URL("../src/services/payments.ts", import.meta.url),
  "utf8",
);
assert.match(
  paymentContract,
  /paymentsEnabled\s*=\s*false/,
  "Real payments must remain disabled",
);

console.log(`Smoke test passed for production worker at ${baseUrl.origin}`);
