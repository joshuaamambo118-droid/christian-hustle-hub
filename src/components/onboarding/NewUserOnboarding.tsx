import { useState } from "react";
import { X, Check, Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type Save = { income?: string; commitment?: string; recommend?: boolean; completed?: boolean };

export default function NewUserOnboarding({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(1);
  const [incomeGoal, setIncomeGoal] = useState("");
  const [commitment, setCommitment] = useState("");
  const [willRecommend, setWillRecommend] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (s: Save) => {
    setSaving(true); setError("");
    const { error } = await supabase.rpc("save_onboarding", {
      p_income_goal: s.income ?? null, p_commitment: s.commitment ?? null,
      p_will_recommend: s.recommend ?? null, p_completed: !!s.completed,
    });
    setSaving(false);
    if (error) { setError(error.message); return false; }
    return true;
  };

  const next = async () => {
    if (step === 1 && incomeGoal && (await save({ income: incomeGoal }))) setStep(2);
    else if (step === 2 && commitment && (await save({ commitment }))) setStep(3);
    else if (step === 3 && willRecommend !== null && (await save({ recommend: willRecommend }))) setStep(4);
  };

  const finish = async () => {
    if (!agreed || !(await save({ completed: true }))) return;
    setShowSuccess(true);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  };

  const opt = (active: boolean) =>
    `w-full rounded-2xl border-2 p-5 text-left transition ${active ? "border-primary bg-primary/10" : "border-border bg-card"}`;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-4">
        <div className="card-surface w-full max-w-md p-8 text-center">
          <div className="btn-gold mx-auto mb-5 h-20 w-20 rounded-full p-0"><Rocket className="h-10 w-10" /></div>
          <h2 className="mb-3 text-2xl font-semibold">Welcome to CHS Global Family! 🚀</h2>
          <p className="mb-8 text-muted-foreground">You're now part of thousands turning skills into income. Your journey starts now!</p>
          <button onClick={onComplete} className="btn-gold h-14 w-full text-lg">Enter Dashboard</button>
        </div>
      </div>
    );
  }

  const Continue = ({ disabled, onClick, label = "Continue" }: { disabled: boolean; onClick: () => void; label?: string }) => (
    <button disabled={disabled || saving} onClick={onClick} className="btn-gold mt-6 h-14 w-full">{saving ? "Saving…" : label}</button>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
      <div className="border-b border-border bg-card p-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex justify-between">
            <span className="text-sm text-primary">Step {step} of 4</span>
            <button onClick={onSkip} className="flex items-center gap-1 text-sm text-muted-foreground">Skip <X className="h-4 w-4" /></button>
          </div>
          <Progress value={step * 25} className="h-2" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <div>
              <h1 className="mb-6 text-center text-3xl font-semibold">What's your income goal?</h1>
              <div className="grid gap-3">
                {["$5 to $15 per month", "$15 to $30 per month", "$30 to $100 per month", "$100+ per month"].map((o) => (
                  <button key={o} onClick={() => setIncomeGoal(o)} className={opt(incomeGoal === o)}>
                    {o} {incomeGoal === o && <Check className="ml-2 inline h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
              <Continue disabled={!incomeGoal} onClick={next} />
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 className="mb-6 text-center text-3xl font-semibold">How do you want to work?</h1>
              <div className="grid gap-3">
                {[{ id: "Full-time", desc: "8+ hrs daily - Build fast" }, { id: "Part-time", desc: "2-4 hrs daily - Side hustle" }, { id: "Weekend", desc: "Flexible" }].map((o) => (
                  <button key={o.id} onClick={() => setCommitment(o.id)} className={opt(commitment === o.id)}>
                    <b>{o.id}</b><div className="text-sm text-muted-foreground">{o.desc}</div>
                  </button>
                ))}
              </div>
              <Continue disabled={!commitment} onClick={next} />
            </div>
          )}
          {step === 3 && (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-semibold">Will you help grow CHS?</h1>
              <div className="grid gap-3">
                <button onClick={() => setWillRecommend(true)} className={opt(willRecommend === true)}>Yes, I'd love to! 💚</button>
                <button onClick={() => setWillRecommend(false)} className={opt(willRecommend === false)}>Maybe later</button>
              </div>
              <Continue disabled={willRecommend === null} onClick={next} />
            </div>
          )}
          {step === 4 && (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-semibold">One last step</h1>
              <div className="card-surface text-left">
                <label className="flex items-center gap-3">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                  <span className="text-sm">I agree to CHS Terms and Privacy Policy</span>
                </label>
              </div>
              <Continue disabled={!agreed} onClick={finish} label="I Agree & Continue" />
            </div>
          )}
          {error && <p className="mt-4 rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
