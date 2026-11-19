import { AuthPage } from "@/components/auth/auth-page";
import { authCapabilities } from "@/lib/auth-config";
export default function ResetPasswordPage() { return <AuthPage mode="reset" googleEnabled={authCapabilities.google} emailDeliveryEnabled={authCapabilities.emailDelivery}/>; }
