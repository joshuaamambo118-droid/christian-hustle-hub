import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, Toast, useMsg } from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { MIN_NGN, MIN_TASKS_FIRST_WITHDRAWAL, MIN_USDT, NGN_RATE, WITHDRAW_LOCK_DAYS } from "@/lib/constants";

export const Route = createFileRoute("/wallet")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Wallet — Christian Hustle Space" },
      { name: "description", content: "Withdraw to OPay or USDT and track your requests." },
      { property: "og:title", content: "Wallet — Christian Hustle Space" },
      { property: "og:description", content: "Withdraw to OPay or USDT and track your requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Shell><Wallet /></Shell>,
});

type W = { id: string; amount: number; method: string; status: string; created_at: string };

function useNow() {
  const [n, setN] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setN(Date.now()), 60000); return () => clearInterval(t); }, []);
  return n;
}

function Wallet() {
  const { profile, refresh } = useAuth();
  const now = useNow();
  const [list, setList] = useState<W[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const isNG = (profile?.country ?? "").toLowerCase() === "nigeria";
  const [method, setMethod] = useState<"NGN" | "USDT">("USDT");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const m = useMsg();

  useEffect(() => { setMethod(isNG ? "NGN" : "USDT"); }, [isNG]);
  const load = async () => {
    const [w, t] = await Promise.all([
      supabase.from("withdrawals").select("id,amount,method,status,created_at").order("created_at", { ascending: false }),
      supabase.from("tasks_log").select("id", { count: "exact", head: true }),
    ]);
    setList((w.data as W[]) ?? []);
    setTotalTasks(t.count ?? 0);
  };
  useEffect(() => { load(); }, []);

  if (!profile) return null;
  const unlockAt = new Date(profile.created_at).getTime() + WITHDRAW_LOCK_DAYS * 86400000;
  const leftMs = unlockAt - now;
  const locked = leftMs > 0;
  const days = Math.floor(leftMs / 86400000);
  const hours = Math.floor((leftMs % 86400000) / 3600000);
  const needTasks = totalTasks < MIN_TASKS_FIRST_WITHDRAWAL;
  const balanceNgn = Number(profile.balance) * NGN_RATE;

  const submit = async () => {
    m.clear();
    const val = Number(amount);
    if (!val || val <= 0) return m.err("Enter a valid amount.");
    const usd = method === "NGN" ? val / NGN_RATE : val;
    if (method === "NGN" && val < MIN_NGN) return m.err(`Minimum withdrawal is ₦${MIN_NGN.toLocaleString()}.`);
    if (method === "USDT" && val < MIN_USDT) return m.err(`Minimum withdrawal is $${MIN_USDT}.`);
    if (usd > Number(profile.balance)) return m.err("Insufficient balance.");
    const d = details.trim();
    if (method === "NGN" && !/^\d{10}\s*,?\s*.{2,}/.test(d)) return m.err("Enter 10-digit account number, bank and account name.");
    if (method === "USDT" && (d.length < 32 || d.length > 120)) return m.err("Enter a valid USDT wallet address (at least 32 characters).");
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", { p_amount_usd: usd, p_method: method === "NGN" ? "NGN-OPAY/BANK" : "USDT", p_details: d });
    setBusy(false);
    if (error) return m.err(error.message);
    m.ok("Withdrawal requested. You'll be paid after admin review.");
    setAmount(""); setDetails(""); refresh(); load();
  };

  return (
    <div className="space-y-5">
      <div className="card-surface">
        <p className="text-sm text-muted-foreground">Available</p>
        <p className="font-display text-4xl text-gold">${Number(profile.balance).toFixed(4)}</p>
        <p className="text-sm text-muted-foreground">≈ ₦{balanceNgn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      </div>

      {locked ? (
        <div className="card-surface border-primary/50">
          <p className="font-semibold">Withdrawal unlocked after 5 days of registration. You have {Math.ceil(leftMs / 86400000)} days left.</p>
          <div className="mt-3 flex gap-3">
            <div className="rounded-xl bg-secondary px-4 py-3 text-center"><p className="font-display text-3xl">{days}</p><p className="text-xs text-muted-foreground">days</p></div>
            <div className="rounded-xl bg-secondary px-4 py-3 text-center"><p className="font-display text-3xl">{hours}</p><p className="text-xs text-muted-foreground">hours</p></div>
          </div>
        </div>
      ) : needTasks ? (
        <div className="card-surface"><p>Complete at least {MIN_TASKS_FIRST_WITHDRAWAL} tasks before your first withdrawal ({totalTasks}/{MIN_TASKS_FIRST_WITHDRAWAL}).</p></div>
      ) : (
        <div className="card-surface space-y-3">
          <h2 className="text-xl">Withdraw</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["NGN", "USDT"] as const).map((x) => (
              <button key={x} onClick={() => setMethod(x)} className={`rounded-xl border py-2 text-sm font-semibold ${method === x ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {x === "NGN" ? `Nigeria NGN (min ₦${MIN_NGN})` : `USDT (min $${MIN_USDT})`}
              </button>
            ))}
          </div>
          <input className="field" inputMode="decimal" placeholder={method === "NGN" ? "Amount in ₦" : "Amount in $"} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="field" maxLength={120} placeholder={method === "NGN" ? "Account number, bank, account name" : "USDT wallet address"} value={details} onChange={(e) => setDetails(e.target.value)} />
          <button className="btn-gold w-full" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Request withdrawal"}</button>
          <Toast msg={m.msg} kind={m.kind} />
        </div>
      )}

      <div className="card-surface">
        <h2 className="mb-3 text-xl">History</h2>
        {!list.length && <p className="text-sm text-muted-foreground">No withdrawals yet.</p>}
        {list.map((w) => (
          <div key={w.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>${Number(w.amount).toFixed(2)} · {w.method}</span>
            <span className={w.status === "approved" ? "text-success" : w.status === "rejected" ? "text-destructive" : "text-primary"}>{w.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
