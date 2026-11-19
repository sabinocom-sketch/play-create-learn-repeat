import { AuthPage } from "@/components/auth/auth-page";
import { authCapabilities } from "@/lib/auth-config";
export default function ForgotPasswordPage() { return <AuthPage mode="forgot" googleEnabled={authCapabilities.google} emailDeliveryEnabled={authCapabilities.emailDelivery}/>; }
