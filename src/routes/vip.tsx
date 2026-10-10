import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, Toast, useMsg } from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NGN_RATE, PAYMENT, PLANS, type PlanKey } from "@/lib/constants";

export const Route = createFileRoute("/vip")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "VIP Plans — Christian Hustle Space" },
      { name: "description", content: "Upgrade to STARTER, PRO or LEGEND for more daily tasks." },
      { property: "og:title", content: "VIP Plans — Christian Hustle Space" },
      { property: "og:description", content: "Upgrade to STARTER, PRO or LEGEND for more daily tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Shell><Vip /></Shell>,
});

const ngn = (usd: number) => "₦" + (usd * NGN_RATE).toLocaleString();

function Vip() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanKey | null>(null);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Choose your plan</h1>
      {(Object.keys(PLANS) as PlanKey[]).map((k) => {
        const p = PLANS[k];
        const current = profile?.vip_plan === k;
        return (
          <div key={k} className={`card-surface flex items-center justify-between gap-4 ${current ? "border-primary" : ""}`}>
            <div>
              <p className="font-display text-xl">{k}</p>
              <p className="text-sm text-muted-foreground">{p.tasks} tasks/day · ${p.monthly}/month potential</p>
              {p.price > 0 && <p className="mt-1 text-primary">${p.price} <span className="text-muted-foreground">({ngn(p.price)})</span></p>}
            </div>
            {current || k === "FREE" ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs">{current ? "Current Plan" : "Free"}</span>
            ) : (
              <button className="btn-gold" onClick={() => setPlan(k)}>Upgrade</button>
            )}
          </div>
        );
      })}
      {plan && <PaymentModal plan={plan} onClose={() => setPlan(null)} />}
    </div>
  );
}

function PaymentModal({ plan, onClose }: { plan: PlanKey; onClose: () => void }) {
  const { session } = useAuth();
  const [method, setMethod] = useState("OPAY");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const m = useMsg();
  const price = PLANS[plan].price;

  const submit = async () => {
    m.clear();
    if (!session) return;
    if (!file) return m.err("Please upload your payment screenshot.");
    if (!file.type.startsWith("image/")) return m.err("Proof must be an image.");
    if (file.size > 5 * 1024 * 1024) return m.err("Image must be under 5MB.");
    setBusy(true);
    const path = `${session.user.id}/vip_${Date.now()}.jpg`;
    const up = await supabase.storage.from("proofs").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return m.err("Upload failed: " + up.error.message); }
    const { error } = await supabase.from("vip_proofs").insert({
      user_id: session.user.id, plan, amount: method === "OPAY" ? ngn(price) : `$${price}`, payment_method: method, proof_url: path,
    });
    setBusy(false);
    if (error) return m.err(error.message);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/70 sm:items-center sm:justify-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl">Pay for {plan}</h3>
        {done ? (
          <>
            <p className="mt-4 rounded-xl bg-success/15 p-4 text-success">Proof submitted, admin will verify within 5 minutes.</p>
            <button className="btn-ghost mt-4 w-full" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["OPAY", "USDT-ARB", "USDT-APT"].map((x) => (
                <button key={x} onClick={() => setMethod(x)} className={`rounded-xl border px-2 py-2 text-xs font-semibold ${method === x ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{x}</button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">
              {method === "OPAY" ? (
                <><p>Send <b className="text-primary">{ngn(price)}</b> to OPAY</p><p className="mt-1 font-mono text-lg">{PAYMENT.opay.number}</p><p>{PAYMENT.opay.name}</p></>
              ) : (
                <><p>Send <b className="text-primary">${price} USDT</b> on {method === "USDT-ARB" ? "Arbitrum One" : "Aptos"}</p>
                  <p className="mt-2 break-all font-mono text-xs">{method === "USDT-ARB" ? PAYMENT.arbitrum : PAYMENT.aptos}</p>
                  <button className="btn-ghost mt-2 text-xs" onClick={() => navigator.clipboard.writeText(method === "USDT-ARB" ? PAYMENT.arbitrum : PAYMENT.aptos)}>Copy address</button></>
              )}
            </div>
            <label className="mt-4 block text-sm">Payment screenshot (required)</label>
            <input type="file" accept="image/*" className="field mt-1" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button className="btn-gold mt-4 w-full" disabled={busy} onClick={submit}>{busy ? "Uploading…" : "Submit proof"}</button>
            <Toast msg={m.msg} kind={m.kind} />
          </>
        )}
      </div>
    </div>
  );
}
