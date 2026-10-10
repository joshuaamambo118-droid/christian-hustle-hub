import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { firePopunder, injectSocialBar } from "@/lib/ads";
import { SupportChat } from "./SupportChat";

export function Shell({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { injectSocialBar(); }, []);
  useEffect(() => {
    if (!session) return;
    const t = setTimeout(firePopunder, 2000);
    return () => clearTimeout(t);
  }, [session]);
  useEffect(() => {
    if (!loading && !session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };
  const links = [
    { to: "/dashboard", label: "Earn" },
    { to: "/vip", label: "VIP" },
    { to: "/wallet", label: "Wallet" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ] as const;

  if (loading || !session) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center justify-between">
        <Link to="/dashboard" className="font-display text-xl font-semibold"><span className="text-gold">Christian</span> Hustle Space</Link>
        <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground">Sign out</button>
      </header>
      <nav className="mb-6 flex gap-2 overflow-x-auto">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground" }}>{l.label}</Link>
        ))}
      </nav>
      {children}
      <SupportChat />
    </div>
  );
}

export function Toast({ msg, kind }: { msg: string; kind: "ok" | "err" }) {
  if (!msg) return null;
  return <p className={`mt-3 rounded-xl px-4 py-3 text-sm ${kind === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{msg}</p>;
}

export function useMsg() {
  const [m, setM] = useState<{ msg: string; kind: "ok" | "err" }>({ msg: "", kind: "ok" });
  return { ...m, ok: (msg: string) => setM({ msg, kind: "ok" }), err: (msg: string) => setM({ msg, kind: "err" }), clear: () => setM({ msg: "", kind: "ok" }) };
}
