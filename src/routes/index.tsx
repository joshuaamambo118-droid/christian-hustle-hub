import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { HCAPTCHA_SITEKEY } from "@/lib/constants";
import { AffiliateBanner, AllVerses, VerseCarousel } from "@/components/Widgets";
import { Toast, useMsg } from "@/components/Shell";
import { injectSocialBar } from "@/lib/ads";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({
    meta: [
      { title: "Christian Hustle Space — Work with all your heart" },
      { name: "description", content: "Complete faith-inspired daily tasks, grow with VIP plans and withdraw to OPay or USDT." },
      { property: "og:title", content: "Christian Hustle Space" },
      { property: "og:description", content: "Faith-driven daily tasks, VIP plans and secure withdrawals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  country: z.string().trim().max(60),
});

function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { ref } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(ref ? "up" : "in");
  const [form, setForm] = useState({ email: "", password: "", country: "Nigeria" });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const cap = useRef<HCaptcha>(null);
  const m = useMsg();

  useEffect(() => { injectSocialBar(); }, []);
  useEffect(() => { if (session) navigate({ to: "/dashboard" }); }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    m.clear();
    const p = schema.safeParse(form);
    if (!p.success) return m.err(p.error.issues[0].message);
    if (!token) return m.err("Please complete the captcha.");
    setBusy(true);
    const { error } =
      mode === "up"
        ? await supabase.auth.signUp({
            email: p.data.email, password: p.data.password,
            options: { captchaToken: token, emailRedirectTo: window.location.origin + "/dashboard", data: { country: p.data.country, referred_by: ref ?? null } },
          })
        : await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password, options: { captchaToken: token } });
    setBusy(false);
    cap.current?.resetCaptcha(); setToken("");
    if (error) return m.err(error.message);
    if (mode === "up") m.ok("Account created. Check your email to confirm, then sign in.");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-primary">Colossians 3:23</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
            Hustle with <span className="text-gold">purpose.</span> Earn with faith.
          </h1>
          <p className="mt-4 text-muted-foreground">Complete simple daily tasks, upgrade to VIP for higher limits, and withdraw to OPay or USDT.</p>
          <div className="mt-6"><VerseCarousel /></div>
        </div>
        <form onSubmit={submit} className="card-surface space-y-3">
          <div className="mb-2 grid grid-cols-2 rounded-xl bg-secondary p-1">
            {(["in", "up"] as const).map((k) => (
              <button type="button" key={k} onClick={() => setMode(k)} className={`rounded-lg py-2 text-sm font-semibold ${mode === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {k === "in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <input className="field" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="password" placeholder="Password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {mode === "up" && (
            <select className="field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              <option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option><option>United States</option><option>United Kingdom</option><option>Other</option>
            </select>
          )}
          {ref && mode === "up" && <p className="text-xs text-muted-foreground">Invited by a friend ✓</p>}
          <div className="overflow-hidden"><HCaptcha ref={cap} sitekey={HCAPTCHA_SITEKEY} theme="dark" onVerify={setToken} onExpire={() => setToken("")} /></div>
          <button className="btn-gold w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
          <Toast msg={m.msg} kind={m.kind} />
        </form>
      </section>
      <section className="mt-14">
        <h2 className="mb-4 text-2xl">12 promises for the diligent</h2>
        <AllVerses />
      </section>
      <section className="mt-10"><AffiliateBanner /></section>
    </main>
  );
}
