export const AUTH_BASE_URL =
  process.env.BETTER_AUTH_URL?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "https://www.playcreatelearnrepeat.com"
    : "http://localhost:3000");

export const authCapabilities = {
  google:
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
  emailDelivery:
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    Boolean(process.env.AUTH_EMAIL_FROM?.trim()),
} as const;

export function requireAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }
  return secret;
}
