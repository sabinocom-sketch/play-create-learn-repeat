import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/auth/account-panel";
import { getAuth } from "@/lib/auth";
import { authCapabilities } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/login?returnTo=/account");
  return <AccountPanel name={session.user.name} email={session.user.email} googleEnabled={authCapabilities.google}/>;
}
