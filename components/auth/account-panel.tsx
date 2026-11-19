"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type SessionItem = { token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date | string; expiresAt: Date | string };
type AccountItem = { id: string; providerId: string };

export function AccountPanel({ name, email, googleEnabled }: { name: string; email: string; googleEnabled: boolean }) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    const [sessionResult, accountResult] = await Promise.all([authClient.listSessions(), authClient.listAccounts()]);
    if (sessionResult.data) setSessions(sessionResult.data as SessionItem[]);
    if (accountResult.data) setAccounts(accountResult.data as AccountItem[]);
  }

  useEffect(() => { void refresh(); }, []);
  const hasGoogle = accounts.some((item) => item.providerId === "google");
  const hasPassword = accounts.some((item) => item.providerId === "credential");

  async function revoke(token: string) {
    const result = await authClient.revokeSession({ token });
    setMessage(result.error ? "Não foi possível terminar essa sessão." : "Sessão terminada.");
    if (!result.error) await refresh();
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  function linkGoogle() {
    void authClient.linkSocial({ provider: "google", callbackURL: "/account?linked=google", errorCallbackURL: "/account?link=error" });
  }

  return <main className="account-page"><section className="account-shell">
    <header className="account-header"><div><Link href="/" className="auth-brand">Play. <i>Create.</i> <em>Learn.</em> <strong>Repeat.</strong></Link><p>Conta pessoal</p></div><button className="secondary" onClick={signOut}>Terminar sessão</button></header>
    <div className="account-grid">
      <section className="account-card"><span className="eyebrow">Perfil</span><h1>{name}</h1><p>{email}</p><div className="account-status"><span>Email confirmado</span></div></section>
      <section className="account-card"><span className="eyebrow">Métodos de acesso</span><h2>Uma conta, todos os acessos</h2><p>Google e palavra-passe ficam associados ao mesmo utilizador e à mesma biblioteca futura.</p>
        <div className="provider-row"><b>Google</b>{hasGoogle ? <span>Associado</span> : <button className="secondary" onClick={linkGoogle} disabled={!googleEnabled}>{googleEnabled ? "Associar Google" : "Por configurar"}</button>}</div>
        <div className="provider-row"><b>Email e palavra-passe</b>{hasPassword ? <span>Ativo</span> : <Link className="secondary" href={`/forgot-password?email=${encodeURIComponent(email)}`}>Adicionar com ligação segura</Link>}</div>
      </section>
      <section className="account-card sessions-card"><span className="eyebrow">Segurança</span><h2>Sessões ativas</h2>{sessions.length === 0 ? <p>A carregar sessões…</p> : <div className="session-list">{sessions.map((item, index) => <div className="session-row" key={item.token}><div><b>{index === 0 ? "Sessão atual ou recente" : "Outro dispositivo"}</b><small>{item.userAgent || "Navegador não identificado"}{item.ipAddress ? ` · ${item.ipAddress}` : ""}</small><small>Expira em {new Date(item.expiresAt).toLocaleDateString("pt-PT")}</small></div><button onClick={() => revoke(item.token)}>Terminar</button></div>)}</div>}{message && <p className="auth-message" role="status">{message}</p>}</section>
      <section className="account-card library-placeholder"><span className="eyebrow">Biblioteca</span><h2>A tua biblioteca pessoal</h2><p>A estrutura da conta está pronta. Os produtos comprados e os direitos de acesso serão ligados aqui numa fase comercial posterior.</p><span>Sem conteúdo pago exposto</span></section>
    </div>
  </section></main>;
}
