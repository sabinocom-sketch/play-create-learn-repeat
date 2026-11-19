import { AuthPage } from "@/components/auth/auth-page";
import { authCapabilities } from "@/lib/auth-config";
export default function RegisterPage() { return <AuthPage mode="register" googleEnabled={authCapabilities.google} emailDeliveryEnabled={authCapabilities.emailDelivery}/>; }
