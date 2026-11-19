import { AuthPage } from "@/components/auth/auth-page";
import { authCapabilities } from "@/lib/auth-config";
export default function VerifyEmailPage() { return <AuthPage mode="verify" googleEnabled={authCapabilities.google} emailDeliveryEnabled={authCapabilities.emailDelivery}/>; }
