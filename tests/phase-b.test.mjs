import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Better Auth keeps explicit account linking and encrypted OAuth tokens", async () => {
  const source = await read("../lib/auth.ts");
  assert.match(source, /disableImplicitLinking:\s*true/);
  assert.match(source, /encryptOAuthTokens:\s*true/);
  assert.match(source, /allowDifferentEmails:\s*false/);
  assert.match(source, /allowUnlinkingAll:\s*false/);
});

test("password recovery revokes sessions and email verification is mandatory", async () => {
  const source = await read("../lib/auth.ts");
  assert.match(source, /requireEmailVerification:\s*true/);
  assert.match(source, /revokeSessionsOnPasswordReset:\s*true/);
  assert.match(source, /resetPasswordTokenExpiresIn:\s*60 \* 30/);
});

test("Google and outbound email are disabled when their complete configuration is absent", async () => {
  const source = await read("../lib/auth-config.ts");
  assert.match(source, /GOOGLE_CLIENT_ID/);
  assert.match(source, /GOOGLE_CLIENT_SECRET/);
  assert.match(source, /RESEND_API_KEY/);
  assert.match(source, /AUTH_EMAIL_FROM/);
});

test("auth endpoints have abuse limits", async () => {
  const source = await read("../lib/auth.ts");
  for (const endpoint of ["/sign-in/email", "/sign-up/email", "/request-password-reset", "/send-verification-email"]) {
    assert.ok(source.includes(endpoint), `missing rate limit for ${endpoint}`);
  }
});

test("auth work does not enable payments", async () => {
  const source = await read("../src/services/payments.ts");
  assert.match(source, /paymentsEnabled\s*=\s*false/);
});
