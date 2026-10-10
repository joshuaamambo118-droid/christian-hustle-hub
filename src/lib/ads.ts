import { POPUNDER_SRC, SOCIAL_BAR_SRC } from "./constants";

const CAP_MS = 10 * 60 * 1000;

export function firePopunder() {
  if (typeof window === "undefined") return;
  const last = Number(localStorage.getItem("lastPopTime") || 0);
  if (Date.now() - last < CAP_MS) return;
  localStorage.setItem("lastPopTime", String(Date.now()));
  const s = document.createElement("script");
  s.src = POPUNDER_SRC;
  s.async = true;
  document.body.appendChild(s);
}

export function injectSocialBar() {
  if (typeof window === "undefined" || document.getElementById("chs-social-bar")) return;
  const s = document.createElement("script");
  s.id = "chs-social-bar";
  s.src = SOCIAL_BAR_SRC;
  s.async = true;
  document.body.appendChild(s);
}
