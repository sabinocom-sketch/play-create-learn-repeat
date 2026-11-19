"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "login" | "register" | "forgot" | "reset" | "verify";
type Locale = "pt" | "en";

const words = {
  pt: {
    loginTitle: "Bem-vindo de volta",
    loginLead: "Entra na tua conta para continuar.",
    registerTitle: "Criar conta",
    registerLead: "Cria uma conta para guardares os teus acessos num só lugar.",
    forgotTitle: "Recuperar acesso",
    forgotLead: "Enviaremos uma ligação segura para o teu email.",
    resetTitle: "Nova palavra-passe",
    resetLead: "Escolhe uma palavra-passe nova para a tua conta.",
    verifyTitle: "Verifica o teu email",
    verifyLead: "Abre a mensagem que enviámos para confirmares a tua conta.",
    google: "Continuar com Google",
    divider: "ou",
    name: "Nome",
    email: "Endereço de email",
    password: "Palavra-passe",
    confirm: "Confirmar palavra-passe",
    signIn: "Entrar",
    signUp: "Criar conta",
    forgot: "Esqueceste-te da palavra-passe?",
    noAccount: "Ainda não tens conta?",
    hasAccount: "Já tens conta?",
    send: "Enviar ligação segura",
    reset: "Guardar nova palavra-passe",
    resend: "Reenviar email de confirmação",
    back: "Voltar ao início",
    emailUnavailable: "O registo e os emails de recuperação ficam disponíveis depois de configurar o serviço de email.",
    googleUnavailable: "O acesso Google fica disponível depois de configurar as credenciais OAuth.",
    sent: "Se existir uma conta com este email, receberás uma mensagem com os próximos passos.",
    registered: "Conta criada. Confirma o teu email antes de iniciares sessão.",
    verified: "Email confirmado. Já podes iniciar sessão.",
    resetDone: "Palavra-passe alterada. Já podes iniciar sessão.",
    mismatch: "As palavras-passe não coincidem.",
    genericError: "Não foi possível concluir o pedido. Confirma os dados e tenta novamente.",
  },
  en: {
    loginTitle: "Welcome back",
    loginLead: "Sign in to your account to continue.",
    registerTitle: "Create account",
    registerLead: "Create one account for all your access rights.",
    forgotTitle: "Recover access",
    forgotLead: "We will send a secure link to your email.",
    resetTitle: "New password",
    resetLead: "Choose a new password for your account.",
    verifyTitle: "Verify your email",
    verifyLead: "Open the message we sent to confirm your account.",
    google: "Continue with Google",
    divider: "or",
    name: "Name",
    email: "Email address",
    password: "Password",
    confirm: "Confirm password",
    signIn: "Sign in",
    signUp: "Create account",
    forgot: "Forgot your password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    send: "Send secure link",
    reset: "Save new password",
    resend: "Resend confirmation email",
    back: "Back to home",
    emailUnavailable: "Registration and recovery emails will be available after the email service is configured.",
    googleUnavailable: "Google sign-in will be available after OAuth credentials are configured.",
    sent: "If an account exists for this email, you will receive the next steps.",
    registered: "Account created. Verify your email before signing in.",
    verified: "Email verified. You can now sign in.",
    resetDone: "Password updated. You can now sign in.",
    mismatch: "The passwords do not match.",
    genericError: "We couldn't complete the request. Check your details and try again.",
  },
};

export function AuthPage({ mode, googleEnabled, emailDeliveryEnabled }: {
  mode: Mode;
  googleEnabled: boolean;
  emailDeliveryEnabled: boolean;
}) {
  const [locale, setLocale] = useState<Locale>("pt");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const t = words[locale];
  const query = useMemo(() => typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search), []);
  const verified = mode === "verify" && query.get("verified") === "1";

  const title = mode === "login" ? t.loginTitle : mode === "register" ? t.registerTitle : mode === "forgot" ? t.forgotTitle : mode === "reset" ? t.resetTitle : t.verifyTitle;
  const lead = mode === "login" ? t.loginLead : mode === "register" ? t.registerLead : mode === "forgot" ? t.forgotLead : mode === "reset" ? t.resetLead : t.verifyLead;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    setBusy(true); setMessage(""); setIsError(false);
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/account" });
        if (result.error) throw result.error;
        window.location.assign("/account");
      } else if (mode === "register") {
        if (password !== confirmation) throw new Error(t.mismatch);
        const result = await authClient.signUp.email({ name: String(data.get("name") ?? "").trim(), email, password, callbackURL: "/verify-email?verified=1" });
        if (result.error) throw result.error;
        setMessage(t.registered);
      } else if (mode === "forgot") {
        await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        setMessage(t.sent);
      } else if (mode === "reset") {
        if (password !== confirmation) throw new Error(t.mismatch);
        const token = query.get("token");
        if (!token) throw new Error(t.genericError);
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) throw result.error;
        setMessage(t.resetDone);
      } else {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email?verified=1" });
        if (result.error) throw result.error;
        setMessage(t.sent);
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error && error.message === t.mismatch ? error.message : t.genericError);
    } finally { setBusy(false); }
  }

  function google() {
    void authClient.signIn.social({ provider: "google", callbackURL: "/account", errorCallbackURL: "/login?oauth=error" });
  }

  const showGoogle = mode === "login" || mode === "register";
  const showEmailPassword = mode === "login" || mode === "register";

  return <main className="auth-page"><section className="auth-card">
    <div className="auth-top"><Link className="auth-brand" href="/">Play. <i>Create.</i> <em>Learn.</em> <strong>Repeat.</strong></Link><button type="button" className="auth-language" onClick={() => setLocale(locale === "pt" ? "en" : "pt")}>{locale.toUpperCase()}</button></div>
    <div className="auth-heading"><h1>{title}</h1><p>{verified ? t.verified : lead}</p></div>
    {showGoogle && <><button type="button" className="google-button" onClick={google} disabled={!googleEnabled || busy}><GoogleMark/>{t.google}</button>{!googleEnabled && <p className="auth-note">{t.googleUnavailable}</p>}<div className="auth-divider"><span>{t.divider}</span></div></>}
    {!verified && <form className="auth-form" onSubmit={submit}>
      {mode === "register" && <label>{t.name}<input name="name" autoComplete="name" required minLength={2}/></label>}
      {(mode === "login" || mode === "register" || mode === "forgot" || mode === "verify") && <label>{t.email}<input name="email" type="email" autoComplete="email" placeholder="exemplo@email.com" required/></label>}
      {(showEmailPassword || mode === "reset") && <label>{t.password}<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} maxLength={128} required/></label>}
      {(mode === "register" || mode === "reset") && <label>{t.confirm}<input name="confirmation" type="password" autoComplete="new-password" minLength={10} maxLength={128} required/></label>}
      {mode === "login" && <Link className="auth-inline-link" href="/forgot-password">{t.forgot}</Link>}
      <button className="primary auth-submit" disabled={busy || ((mode === "register" || mode === "forgot" || mode === "verify") && !emailDeliveryEnabled)}>{busy ? "…" : mode === "login" ? t.signIn : mode === "register" ? t.signUp : mode === "forgot" ? t.send : mode === "reset" ? t.reset : t.resend}</button>
      {!emailDeliveryEnabled && mode !== "login" && mode !== "reset" && <p className="auth-note">{t.emailUnavailable}</p>}
    </form>}
    {message && <p className={isError ? "auth-message error" : "auth-message"} role="status">{message}</p>}
    <div className="auth-footer">{mode === "login" ? <p>{t.noAccount} <Link href="/register">{t.signUp}</Link></p> : mode === "register" ? <p>{t.hasAccount} <Link href="/login">{t.signIn}</Link></p> : <p><Link href="/login">{t.signIn}</Link></p>}<Link href="/">{t.back}</Link></div>
  </section></main>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z"/><path fill="#ea4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/></svg>;
}
