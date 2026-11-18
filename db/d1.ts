// Optional legacy Sites/Cloudflare adapter, isolated from the Render Node runtime.
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

export function getD1Db() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return drizzle(env.DB);
}
