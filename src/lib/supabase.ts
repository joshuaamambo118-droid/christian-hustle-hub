import { createClient } from "@supabase/supabase-js";

// Publishable (anon) values — safe in browser code. Security is enforced by RLS + RPC functions.
const url =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "https://fpcjtulvvyxclbktfloc.supabase.co";
const anon =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwY2p0dWx2dnl4Y2xia3RmbG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTM3MTQsImV4cCI6MjEwNzEyOTcxNH0.I3cUo1gopvmJQAmOmCcHJgasvz2bnIIMg3yeHzmwJz4";

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type Profile = {
  id: string;
  email: string;
  balance: number;
  is_vip: boolean;
  vip_plan: "FREE" | "STARTER" | "PRO" | "LEGEND";
  vip_tasks_limit: number;
  tasks_completed_today: number;
  last_task_date: string;
  country: string | null;
  created_at: string;
  is_admin: boolean;
  referred_by: string | null;
  total_tasks: number;
  onboarding_completed?: boolean | null;
};
