import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Christian Hustle Space" },
      { name: "description", content: "Review VIP proofs and withdrawal requests." },
      { property: "og:title", content: "Admin — Christian Hustle Space" },
      { property: "og:description", content: "Review VIP proofs and withdrawal requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Shell><Admin /></Shell>,
});

type Proof = { id: string; user_id: string; plan: string; amount: string; payment_method: string; proof_url: string; status: string; created_at: string };
type Wd = { id: string; user_id: string; amount: number; method: string; details: string; status: string; created_at: string };

function Admin() {
  const { isAdmin } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [wds, setWds] = useState<Wd[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  const load = async () => {
    const [p, w, u] = await Promise.all([
      supabase.from("vip_proofs").select("*").eq("status", "pending").order("created_at"),
      supabase.from("withdrawals").select("*").eq("status", "pending").order("created_at"),
      supabase.from("profiles").select("id,email"),
    ]);
    setProofs((p.data as Proof[]) ?? []);
    setWds((w.data as Wd[]) ?? []);
    setEmails(Object.fromEntries(((u.data as { id: string; email: string }[]) ?? []).map((x) => [x.id, x.email])));
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <p className="text-muted-foreground">Admins only.</p>;

  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 300);
    if (error) return setErr(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  };
  const act = async (fn: string, id: string, approve: boolean) => {
    setErr("");
    const { error } = await supabase.rpc(fn, { p_id: id, p_approve: approve });
    if (error) setErr(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      {err && <p className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{err}</p>}
      <section>
        <h2 className="mb-3 text-2xl">VIP proofs ({proofs.length})</h2>
        {proofs.map((p) => (
          <div key={p.id} className="card-surface mb-3 text-sm">
            <p className="font-semibold">{emails[p.user_id] ?? p.user_id} → {p.plan}</p>
            <p className="text-muted-foreground">{p.amount} via {p.payment_method} · {new Date(p.created_at).toLocaleString()}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => view(p.proof_url)}>View proof</button>
              <button className="btn-gold" onClick={() => act("admin_review_vip", p.id, true)}>Approve</button>
              <button className="btn-ghost" onClick={() => act("admin_review_vip", p.id, false)}>Reject</button>
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2 className="mb-3 text-2xl">Withdrawals ({wds.length})</h2>
        {wds.map((w) => (
          <div key={w.id} className="card-surface mb-3 text-sm">
            <p className="font-semibold">{emails[w.user_id] ?? w.user_id} · ${Number(w.amount).toFixed(2)} ({w.method})</p>
            <p className="break-all text-muted-foreground">{w.details}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-gold" onClick={() => act("admin_review_withdrawal", w.id, true)}>Mark paid</button>
              <button className="btn-ghost" onClick={() => act("admin_review_withdrawal", w.id, false)}>Reject & refund</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
