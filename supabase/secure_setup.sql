-- Christian Hustle Space — run AFTER your original SQL, in the SQL editor.
-- Leaves the existing "proofs" storage bucket policies untouched.
-- Moves all money/VIP changes into secure server functions so users cannot edit balances.

alter table profiles add column if not exists referred_by uuid references profiles(id);
alter table profiles add column if not exists total_tasks int default 0;

-- Grants (Data API)
grant select on profiles, vip_proofs, withdrawals, transfers, tasks_log to authenticated;
grant insert on vip_proofs, transfers to authenticated;

-- Remove unsafe direct-write policies
drop policy if exists "users insert own profile" on profiles;
drop policy if exists "users update own profile" on profiles;
drop policy if exists "admin update all profiles" on profiles;
drop policy if exists "insert own withdrawal" on withdrawals;
drop policy if exists "insert own task log" on tasks_log;
drop policy if exists "admin update vip_proofs" on vip_proofs;
drop policy if exists "admin all withdrawals" on withdrawals;
create policy "admin view all withdrawals" on withdrawals for select using (auth.jwt()->>'email'='admin@christianhustlespace.com');

-- VIP proofs: users may only insert pending proofs for themselves, in their own folder
drop policy if exists "insert own vip proof" on vip_proofs;
create policy "insert own vip proof" on vip_proofs for insert
  with check (auth.uid()=user_id and status='pending' and verified_at is null and proof_url like auth.uid()::text || '/%');

drop policy if exists "insert own transfer" on transfers;
create policy "insert own transfer" on transfers for insert with check (auth.uid()=from_user and status='pending');

-- Auto-create profile on signup (with referral)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ref uuid;
begin
  begin ref := nullif(new.raw_user_meta_data->>'referred_by','')::uuid; exception when others then ref := null; end;
  if ref is not null and not exists (select 1 from profiles where id = ref) then ref := null; end if;
  insert into profiles (id, email, country, referred_by)
  values (new.id, new.email, left(new.raw_user_meta_data->>'country', 60), ref)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Backfill profiles for existing users
insert into profiles (id, email) select id, email from auth.users on conflict (id) do nothing;
update profiles p set total_tasks = (select count(*) from tasks_log t where t.user_id = p.id);

create or replace function public.ensure_daily_reset() returns void
language sql security definer set search_path = public as $$
  update profiles set tasks_completed_today = 0, last_task_date = current_date
  where id = auth.uid() and last_task_date is distinct from current_date;
$$;

create or replace function public.complete_task(p_with_bonus boolean) returns json
language plpgsql security definer set search_path = public as $$
declare p profiles; base numeric; bonus numeric; reward numeric; last_at timestamp;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into p from profiles where id = auth.uid() for update;
  if p.id is null then raise exception 'Profile not found'; end if;
  if p.last_task_date is distinct from current_date then
    p.tasks_completed_today := 0;
  end if;
  if p.tasks_completed_today >= p.vip_tasks_limit then raise exception 'Daily task limit reached. Come back tomorrow.'; end if;
  select max(created_at) into last_at from tasks_log where user_id = auth.uid();
  if last_at is not null and now() - last_at < interval '60 seconds' then
    raise exception 'Please wait % seconds before the next task.', ceil(60 - extract(epoch from now() - last_at));
  end if;
  case p.vip_plan
    when 'STARTER' then base := 0.00466; bonus := 0.002;
    when 'PRO'     then base := 0.006;   bonus := 0.00288;
    when 'LEGEND'  then base := 0.00583; bonus := 0.0025;
    else                base := 0.007;   bonus := 0.003;
  end case;
  reward := base + case when p_with_bonus then bonus else 0 end;
  insert into tasks_log (user_id, reward, task_type) values (auth.uid(), reward, case when p_with_bonus then 'bonus' else 'base' end);
  update profiles set balance = balance + reward, tasks_completed_today = p.tasks_completed_today + 1,
    last_task_date = current_date, total_tasks = coalesce(total_tasks,0) + 1 where id = auth.uid();
  return json_build_object('reward', reward);
end $$;

create or replace function public.request_withdrawal(p_amount_usd numeric, p_method text, p_details text) returns void
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into p from profiles where id = auth.uid() for update;
  if now() - p.created_at < interval '5 days' then
    raise exception 'Withdrawal unlocked after 5 days of registration. You have % days left.',
      ceil(extract(epoch from (p.created_at + interval '5 days' - now())) / 86400);
  end if;
  if coalesce(p.total_tasks,0) < 25 then raise exception 'Complete at least 25 tasks before your first withdrawal.'; end if;
  if p_method not in ('NGN-OPAY/BANK','USDT') then raise exception 'Invalid method'; end if;
  if p_method = 'USDT' and p_amount_usd < 5 then raise exception 'Minimum USDT withdrawal is $5.'; end if;
  if p_method = 'NGN-OPAY/BANK' and p_amount_usd * 1600 < 999.99 then raise exception 'Minimum NGN withdrawal is N1000.'; end if;
  if p_method = 'USDT' and char_length(trim(p_details)) < 32 then raise exception 'Invalid wallet address.'; end if;
  if char_length(p_details) > 120 then raise exception 'Details too long.'; end if;
  if p_amount_usd > p.balance then raise exception 'Insufficient balance.'; end if;
  update profiles set balance = balance - p_amount_usd where id = auth.uid();
  insert into withdrawals (user_id, amount, method, details) values (auth.uid(), round(p_amount_usd, 4), p_method, trim(p_details));
end $$;

create or replace function public.is_chs_admin() returns boolean language sql stable as $$
  select coalesce(auth.jwt()->>'email','') = 'admin@christianhustlespace.com';
$$;

create or replace function public.admin_review_vip(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v vip_proofs; lim int; ref1 uuid; ref2 uuid;
begin
  if not is_chs_admin() then raise exception 'Forbidden'; end if;
  select * into v from vip_proofs where id = p_id and status = 'pending' for update;
  if v.id is null then raise exception 'Proof not pending'; end if;
  if not p_approve then
    update vip_proofs set status='rejected', verified_at=now() where id=p_id; return;
  end if;
  lim := case v.plan when 'STARTER' then 100 when 'PRO' then 150 when 'LEGEND' then 200 else 50 end;
  update vip_proofs set status='approved', verified_at=now() where id=p_id;
  update profiles set is_vip=true, vip_plan=v.plan, vip_tasks_limit=lim where id=v.user_id;
  -- Referral: $8 direct, $2 second generation (paid once per user's first approval)
  if (select count(*) from vip_proofs where user_id=v.user_id and status='approved') = 1 then
    select referred_by into ref1 from profiles where id=v.user_id;
    if ref1 is not null then
      update profiles set balance=balance+8 where id=ref1;
      select referred_by into ref2 from profiles where id=ref1;
      if ref2 is not null then update profiles set balance=balance+2 where id=ref2; end if;
    end if;
  end if;
end $$;

create or replace function public.admin_review_withdrawal(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare w withdrawals;
begin
  if not is_chs_admin() then raise exception 'Forbidden'; end if;
  select * into w from withdrawals where id=p_id and status='pending' for update;
  if w.id is null then raise exception 'Withdrawal not pending'; end if;
  if p_approve then
    update withdrawals set status='approved' where id=p_id;
  else
    update withdrawals set status='rejected' where id=p_id;
    update profiles set balance=balance+w.amount where id=w.user_id;
  end if;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.complete_task(boolean), public.request_withdrawal(numeric,text,text),
  public.ensure_daily_reset(), public.admin_review_vip(uuid,boolean), public.admin_review_withdrawal(uuid,boolean) from public, anon;
grant execute on function public.complete_task(boolean), public.request_withdrawal(numeric,text,text),
  public.ensure_daily_reset(), public.admin_review_vip(uuid,boolean), public.admin_review_withdrawal(uuid,boolean) to authenticated;
