import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, Toast, useMsg } from "@/components/Shell";
import { AffiliateBanner, VerseCarousel } from "@/components/Widgets";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PLANS, REWARD_LINKS } from "@/lib/constants";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Earn — Christian Hustle Space" },
      { name: "description", content: "Complete your daily tasks and claim reward bonuses." },
      { property: "og:title", content: "Earn — Christian Hustle Space" },
      { property: "og:description", content: "Complete your daily tasks and claim reward bonuses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Shell><Dashboard /></Shell>,
});

function Dashboard() {
  const { profile, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [rewardClicked, setRewardClicked] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [linkIdx, setLinkIdx] = useState(0);
  const m = useMsg();

  useEffect(() => {
    if (!rewardClicked) return;
    const t = setTimeout(() => setCanClaim(true), 7000);
    return () => clearTimeout(t);
  }, [rewardClicked]);

  if (!profile) return <p className="text-muted-foreground">Loading your account…</p>;
  const plan = PLANS[profile.vip_plan] ?? PLANS.FREE;
  const done = profile.tasks_completed_today;
  const pct = Math.min(100, (done / profile.vip_tasks_limit) * 100);

  const runTask = async (withBonus: boolean) => {
    if (busy) return;
    setBusy(true); m.clear();
    const { data, error } = await supabase.rpc("complete_task", { p_with_bonus: withBonus });
    setBusy(false);
    if (error) return m.err(error.message);
    const r = data as { reward: number };
    m.ok(`+$${Number(r.reward).toFixed(5)} added to your balance.`);
    if (withBonus) { setRewardClicked(false); setCanClaim(false); setLinkIdx((i) => (i + 1) % REWARD_LINKS.length); }
    refresh();
  };

  const refLink = typeof window !== "undefined" ? `${window.location.origin}/?ref=${profile.id}` : "";

  return (
    <div className="space-y-5">
      <div className="card-surface">
        <p className="text-sm text-muted-foreground">Balance</p>
        <p className="font-display text-4xl font-semibold text-gold">${Number(profile.balance).toFixed(4)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Plan: <span className="text-primary">{profile.vip_plan}</span> · up to ${plan.monthly}/month if you finish daily</p>
      </div>

      <div className="card-surface">
        <div className="flex justify-between text-sm"><span>Today's tasks</span><span>{done}/{profile.vip_tasks_limit}</span></div>
        <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-3 text-xs text-muted-foreground">Per task: ${plan.base} base + ${plan.bonus} bonus with reward ad. One task every 60 seconds.</p>
        <div className="mt-4 grid gap-3">
          <a
            href={REWARD_LINKS[linkIdx]} target="_blank" rel="noopener noreferrer"
            onClick={() => { setRewardClicked(true); setCanClaim(false); }}
            className="btn-gold w-full"
          >Open Reward Ad To Earn Extra</a>
          {rewardClicked && (
            <button className="btn-gold w-full" disabled={!canClaim || busy} onClick={() => runTask(true)}>
              {canClaim ? "Claim Bonus" : "Wait 7 seconds…"}
            </button>
          )}
          <button className="btn-ghost w-full" disabled={busy || done >= profile.vip_tasks_limit} onClick={() => runTask(false)}>
            {done >= profile.vip_tasks_limit ? "Daily limit reached" : "Complete task (base only)"}
          </button>
        </div>
        <Toast msg={m.msg} kind={m.kind} />
      </div>

      <div className="card-surface">
        <p className="font-semibold">Invite friends</p>
        <p className="mt-1 text-xs text-muted-foreground">Earn $8 when a direct referral upgrades to VIP, plus $2 from their referrals.</p>
        <div className="mt-3 flex gap-2">
          <input readOnly className="field text-xs" value={refLink} />
          <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(refLink)}>Copy</button>
        </div>
      </div>

      <VerseCarousel />
      <AffiliateBanner />
    </div>
  );
}
