import { useMemo, useState } from "react";
import { firePopunder } from "@/lib/ads";
import { WHATSAPP } from "@/lib/constants";

const FAQ = [
  { q: "How do I earn?", a: "Complete daily tasks on the Earn page. Open a reward ad and claim the bonus for extra per task." },
  { q: "When can I withdraw?", a: "Withdrawals unlock 5 days after registration and after you complete at least 25 tasks." },
  { q: "What is the minimum withdrawal?", a: "Nigeria (NGN): ₦1,000. USDT: $5." },
  { q: "How long does VIP approval take?", a: "Upload your payment proof; the admin verifies within about 5 minutes." },
  { q: "How do referrals work?", a: "Share your referral link. You earn $8 when a direct referral upgrades to VIP and $2 for 2nd generation." },
  { q: "Why are tasks limited?", a: "FREE has 50 tasks/day, STARTER 100, PRO 150, LEGEND 200. Limits reset daily." },
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? FAQ.filter((f) => (f.q + f.a).toLowerCase().includes(t)) : FAQ;
  }, [q]);

  return (
    <>
      <button
        onClick={() => { firePopunder(); setOpen(true); }}
        className="btn-gold fixed bottom-5 right-5 z-40 rounded-full px-5"
        aria-label="Open support chat"
      >💬 Help</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-background/70" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl">Support</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground">Close</button>
            </div>
            <input className="field" placeholder="Type your question…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-4 space-y-3">
              {results.map((f) => (
                <div key={f.q} className="rounded-xl bg-secondary p-3">
                  <p className="font-semibold">{f.q}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
              {!results.length && <p className="text-sm text-muted-foreground">No match. Chat with us on WhatsApp.</p>}
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn-gold mt-5 w-full">Chat on WhatsApp</a>
          </div>
        </div>
      )}
    </>
  );
}
