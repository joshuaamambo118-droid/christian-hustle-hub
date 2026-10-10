import { useEffect, useState } from "react";
import { AFFILIATE_LINK, BIBLE_VERSES } from "@/lib/constants";

export function VerseCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % BIBLE_VERSES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const v = BIBLE_VERSES[i]!;
  return (
    <div className="card-surface">
      <p className="text-xs uppercase tracking-widest text-primary">Word for today · {i + 1}/12</p>
      <p className="mt-2 font-display text-lg italic leading-snug">“{v.text}”</p>
      <p className="mt-2 text-sm text-muted-foreground">— {v.ref}</p>
      <div className="mt-3 flex gap-1">
        {BIBLE_VERSES.map((x, k) => (
          <button key={x.ref} aria-label={x.ref} onClick={() => setI(k)} className={`h-1.5 flex-1 rounded-full ${k === i ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export function AllVerses() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BIBLE_VERSES.map((v) => (
        <div key={v.ref} className="card-surface">
          <p className="font-display italic">“{v.text}”</p>
          <p className="mt-2 text-sm text-primary">{v.ref}</p>
        </div>
      ))}
    </div>
  );
}

export function AffiliateBanner() {
  return (
    <div className="rounded-2xl border border-primary/40 bg-secondary p-5">
      <h3 className="text-xl">Ready to Master Affiliate &amp; Digital Marketing?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Discover How Thousands Are Earning Online With Proven Strategies. Click Below To Join Our Top-Rated Students Today!
      </p>
      <a href={AFFILIATE_LINK} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4">Join Now</a>
    </div>
  );
}
