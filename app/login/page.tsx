import { AuthPage } from "@/components/auth/auth-page";
import { authCapabilities } from "@/lib/auth-config";
export default function LoginPage() { return <AuthPage mode="login" googleEnabled={authCapabilities.google} emailDeliveryEnabled={authCapabilities.emailDelivery}/>; }
