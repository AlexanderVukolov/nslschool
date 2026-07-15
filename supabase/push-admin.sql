-- ============================================================
-- Администратор видит, у кого включены push-уведомления
-- Выполнить в Supabase → SQL Editor → New query → Run
-- (требует admin.sql — функцию public.is_admin())
-- ============================================================

drop policy if exists "push_select_admin" on public.push_subscriptions;
create policy "push_select_admin" on public.push_subscriptions
  for select to authenticated using (public.is_admin());
