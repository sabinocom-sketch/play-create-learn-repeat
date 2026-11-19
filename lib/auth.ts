import "server-only";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { AUTH_BASE_URL, authCapabilities, requireAuthSecret } from "@/lib/auth-config";
import { sendAuthEmail } from "@/src/services/auth-email";

let authInstance: ReturnType<typeof createAuth> | undefined;

function createAuth() {
  const socialProviders = authCapabilities.google
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        },
      }
    : {};

  return betterAuth({
    appName: "Play. Create. Learn. Repeat.",
    baseURL: AUTH_BASE_URL,
    secret: requireAuthSecret(),
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    trustedOrigins: [AUTH_BASE_URL],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !authCapabilities.emailDelivery,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 30,
      sendResetPassword: async ({ user, url }) =>
        sendAuthEmail({ kind: "password-reset", to: user.email, name: user.name, url }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) =>
        sendAuthEmail({ kind: "verification", to: user.email, name: user.name, url }),
    },
    socialProviders,
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        trustedProviders: ["google"],
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
        updateUserInfoOnLink: false,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: "memory",
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 300, max: 5 },
        "/send-verification-email": { window: 300, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
  });
}

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
