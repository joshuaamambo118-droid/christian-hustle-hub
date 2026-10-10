# Christian Hustle Hub

Build production app Christian Hustle Space - React Vite Tailwind Supabase Netlify secure final with corrected earnings and 5 days withdrawal lock - FIXES APPLIED VERSION.



=== ENV FINAL FOR LOVABLE - USE THIS ONLY ===

VITE_SUPABASE_URL=https://fpcjtulvvyxclbktfloc.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwY2p0dWx2dnl4Y2xia3RmbG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTM3MTQsImV4cCI6MjEwNzEyOTcxNH0.I3cUo1gopvmJQAmOmCcHJgasvz2bnIIMg3yeHzmwJz4

VITE_HCAPTCHA_SITEKEY=72fc5a0c-5552-4e34-bd98-dce28f7cbd84



DO NOT USE sb_publishable_ key for VITE_SUPABASE_ANON_KEY - use eyJ legacy only. ADMIN_EMAIL hardcoded admin@christianhustlespace.com in code, not in env.



=== SQL FIXED - KEEP EXISTING STORAGE POLICIES ===

create extension if not exists pgcrypto;

create table if not exists profiles (id uuid primary key references auth.users(id), email text unique, balance numeric default 0 check (balance>=0), is_vip boolean default false, vip_plan text default 'FREE', vip_tasks_limit int default 50, tasks_completed_today int default 0, last_task_date date default current_date, country text, created_at timestamp default now(), is_admin boolean default false);

create table if not exists vip_proofs (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), plan text not null, amount text, payment_method text, proof_url text not null check (char_length(proof_url)>10), status text default 'pending' check (status in ('pending','approved','rejected')), created_at timestamp default now(), verified_at timestamp);

create table if not exists withdrawals (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), amount numeric not null check (amount>0), method text not null, details text not null, status text default 'pending' check (status in ('pending','approved','rejected')), proof_url text, created_at timestamp default now());

create table if not exists transfers (id uuid primary key default gen_random_uuid(), from_user uuid references profiles(id), to_user text not null, amount numeric not null check (amount>0), network text not null, hash text not null check (char_length(hash)>=32), proof_url text not null check (char_length(proof_url)>10), status text default 'pending', created_at timestamp default now());

create table if not exists tasks_log (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), reward numeric not null, task_type text default 'base', created_at timestamp default now());

alter table profiles enable row level security; alter table vip_proofs enable row level security; alter table withdrawals enable row level security; alter table transfers enable row level security; alter table tasks_log enable row level security;

drop policy if exists "users view own profile" on profiles; create policy "users view own profile" on profiles for select using (auth.uid()=id);

drop policy if exists "admin view all profiles" on profiles; create policy "admin view all profiles" on profiles for select using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "users insert own profile" on profiles; create policy "users insert own profile" on profiles for insert with check (auth.uid()=id);

drop policy if exists "users update own profile" on profiles; create policy "users update own profile" on profiles for update using (auth.uid()=id) with check (auth.uid()=id);

drop policy if exists "admin update all profiles" on profiles; create policy "admin update all profiles" on profiles for update using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "insert own vip proof" on vip_proofs; create policy "insert own vip proof" on vip_proofs for insert with check (auth.uid()=user_id);

drop policy if exists "view own proofs" on vip_proofs; create policy "view own proofs" on vip_proofs for select using (auth.uid()=user_id);

drop policy if exists "admin view all vip_proofs" on vip_proofs; create policy "admin view all vip_proofs" on vip_proofs for select using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "admin update vip_proofs" on vip_proofs; create policy "admin update vip_proofs" on vip_proofs for update using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "insert own withdrawal" on withdrawals; create policy "insert own withdrawal" on withdrawals for insert with check (auth.uid()=user_id);

drop policy if exists "view own withdrawals" on withdrawals; create policy "view own withdrawals" on withdrawals for select using (auth.uid()=user_id);

drop policy if exists "admin all withdrawals" on withdrawals; create policy "admin all withdrawals" on withdrawals for all using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "insert own transfer" on transfers; create policy "insert own transfer" on transfers for insert with check (auth.uid()=from_user);

drop policy if exists "view own transfers" on transfers; create policy "view own transfers" on transfers for select using (auth.uid()=from_user);

drop policy if exists "admin all transfers" on transfers; create policy "admin all transfers" on transfers for all using (auth.jwt()->>'email'='admin@christianhustlespace.com');

drop policy if exists "insert own task log" on tasks_log; create policy "insert own task log" on tasks_log for insert with check (auth.uid()=user_id);

drop policy if exists "view own logs" on tasks_log; create policy "view own logs" on tasks_log for select using (auth.uid()=user_id);

-- DO NOT TOUCH proofs bucket policies already created manually 4 policies with authenticated true



12 BIBLE VERSES MUST SHOW:

const BIBLE_VERSES = [

{ref:"Philippians 4:13", text:"I can do all things through Christ who strengthens me."},

{ref:"Jeremiah 29:11", text:"For I know the plans I have for you declares the LORD plans to prosper you."},

{ref:"Proverbs 16:3", text:"Commit to the LORD whatever you do and He will establish your plans."},

{ref:"Joshua 1:8", text:"Keep this Book of the Law always on your lips meditate on it day and night."},

{ref:"Deuteronomy 8:18", text:"Remember the LORD your God for it is He who gives you ability to produce wealth."},

{ref:"Psalm 128:2", text:"You will eat the fruit of your labor blessings and prosperity will be yours."},

{ref:"Colossians 3:23", text:"Whatever you do work at it with all your heart as working for the LORD."},

{ref:"Proverbs 14:23", text:"All hard work brings a profit but mere talk leads only to poverty."},

{ref:"2 Thessalonians 3:10", text:"The one who is unwilling to work shall not eat."},

{ref:"Isaiah 41:10", text:"Fear not for I am with you be not dismayed for I am your God."},

{ref:"Matthew 6:33", text:"Seek first His kingdom and His righteousness and all these things will be added."},

{ref:"Proverbs 10:4", text:"Lazy hands make for poverty but diligent hands bring wealth."}

];



EARNINGS CORRECTED SUSTAINABLE MODEL:

FREE tier 50 tasks per day, monthly $15 if completes daily = daily $0.50 = per task base $0.007 + bonus $0.003 = $0.01 total per task. 30 days x 0.5 = $15.

STARTER price $20, 100 tasks per day, monthly $20 if daily = daily $0.666, per task base $0.00466 + bonus $0.002 = $0.00666 per task.

PRO price $40, 150 tasks per day, monthly $40 if daily = daily $1.333, per task base $0.006 + bonus $0.00288 = $0.00888 per task.

LEGEND price $50, 200 tasks per day, monthly $50 if daily = daily $1.666, per task base $0.00583 + bonus $0.0025 = $0.00833 per task.

VIP prices display: STARTER $20 (N32000), PRO $40 (N64000), LEGEND $50 (N80000) rate $1=N1600. FREE shows Current Plan.



WITHDRAWAL LOCK NEW RULE - APPLY THIS:

Check profiles.created_at, if now - created_at < 5 days block withdrawal with message "Withdrawal unlocked after 5 days of registration. You have X days left." Show countdown days/hours. Also require minimum 25 tasks completed before first withdrawal. NEW MINIMUM: Nigeria NGN Min N1000, USDT Min $5 (DELETE OLD $1000 minimum everywhere).



FRONTEND LOGIC SECURE:

VIP frontend only upload to proofs/{userId}/vip_{timestamp}.jpg then INSERT vip_proofs status pending, show Proof submitted admin will verify within 5 minutes, never update profiles is_vip. Admin approves via dashboard.

Daily reset if last_task_date!= today reset tasks_completed_today 0.

Anti double click check tasks_log last created <60 sec block.

Reward button mobile safe use <a href="https://arwf.org/4/3de0aee910dace879b41c02c1075b687" target="_blank">Open Reward Ad To Earn Extra</a> rotate with https://uplcm.com/4/11984736, on click set rewardClicked true, show Claim Bonus after 7 sec.

Popunder cap 10min localStorage lastPopTime, inject script src https://afders.org/1/54be4850af6bdf549420a2bebe0c2b35 after login 2 sec delay and on chat button click with cap.

Social Bar inject once on mount src https://bicea.org/14/52f95671785c97e39fbfc2851a88161b sticky.

Netlify public/_redirects "/* /index.html 200" and netlify.toml [[redirects]] from="/*" to="/index.html" status=200.

Add.env.example with only VITE_ keys.

Payment modal OPAY 8131913507 Joshua Amambo, USDT Arbitrum One 0xe97cd7780c899e093d88839f0d263ba832738581, Aptos 0x8a57479d4af236e991c8f554c1a3f36a6d0ba5d9316e4400e82a872709bff7af, upload required.

Withdrawal detection Nigeria NGN Min N1000 else USDT Min $5, hash validation >=32, upload required error handling.

Affiliate banner Ready to Master Affiliate & Digital Marketing? Discover How Thousands Are Earning Online With Proven Strategies. Click Below To Join Our Top-Rated Students Today! link https://Jomambo.blogspot.com.

Support chat floating button popunder cap then drawer FAQ autocomplete and WhatsApp https://wa.me/2349122074348.

REFERRAL: Keep Direct $8 + 2nd gen $2 if already implemented, else add field referred_by in profiles.

Build Vite React Tailwind supabase-js react-hcaptcha sitekey only, GitHub Netlify ready.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59b61313-0cb7-41f3-9abb-e2d6101d56e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
