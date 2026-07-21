-- ============================================================
-- Задачник NSL — схема базы данных Supabase
-- Выполнить один раз: Dashboard → SQL Editor → New query →
-- вставить весь файл → Run
-- ============================================================

-- ---------- Профили сотрудников ----------
-- Создаётся автоматически при регистрации (см. триггер ниже)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  email      text not null,
  dept       text,
  role       text default 'Сотрудник',
  avatar_url text,
  created_at timestamptz default now()
);

-- ---------- Задачи ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  measure     text default '',          -- SMART: измеримый результат
  relevance   text default '',          -- SMART: цель/значимость
  result      text default '',          -- результат выполнения (обязателен для «Готово»)
  dept        text not null,
  assignees   uuid[] default '{}',      -- несколько ответственных
  status      text not null default 'todo',
  priority    text not null default 'medium',
  due         date,
  due_time    text,                     -- время дедлайна «ЧЧ:ММ» (опционально)
  recur       text,                     -- повторение: daily/weekdays/weekly/monthly
  tags        text[] default '{}',
  attachments jsonb default '[]',       -- [{type:'link'|'file', name, url, size}]
  created_by  uuid references auth.users (id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------- Уведомления ----------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  task_id    uuid references public.tasks (id) on delete cascade,
  task_title text not null,
  by_name    text,
  type       text not null default 'task_done',
  read       boolean default false,
  created_at timestamptz default now()
);

-- ---------- Автосоздание профиля при регистрации ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, dept, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'dept',
    coalesce(new.raw_user_meta_data ->> 'role', 'Сотрудник')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Обновление updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ---------- Права доступа (RLS) ----------
alter table public.profiles      enable row level security;
alter table public.tasks         enable row level security;
alter table public.notifications enable row level security;

-- Профили: все сотрудники видят всех, редактируют только свой
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Задачи: общие для всей команды
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select to authenticated using (true);

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks
  for update to authenticated using (true);

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete to authenticated using (true);

-- Уведомления: каждый читает/меняет только свои, создавать может любой
-- аутентифицированный (уведомление адресуется другому сотруднику)
drop policy if exists "notif_select_own" on public.notifications;
create policy "notif_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notif_insert" on public.notifications;
create policy "notif_insert" on public.notifications
  for insert to authenticated with check (true);

drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "notif_delete_own" on public.notifications;
create policy "notif_delete_own" on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- Realtime: живые обновления доски и уведомлений ----------
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ---------- Хранилище файлов-вложений ----------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments_read" on storage.objects;
create policy "attachments_read" on storage.objects
  for select to authenticated using (bucket_id = 'attachments');

drop policy if exists "attachments_upload" on storage.objects;
create policy "attachments_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments');

drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments');
