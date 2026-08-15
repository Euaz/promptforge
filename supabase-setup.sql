-- PromptForge cloud sync schema.
-- Paste this into the Supabase SQL Editor and run it once.
-- Row-level security is what keeps users' prompts private, so do not skip the policies.

create table if not exists public.prompts (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  template_id text,
  body        text,
  values      jsonb default '{}'::jsonb,
  options     jsonb default '{}'::jsonb,
  tags        text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists prompts_user_id_idx on public.prompts (user_id, updated_at desc);

alter table public.prompts enable row level security;

-- Each user can only ever see or touch their own rows.
drop policy if exists "own rows: select" on public.prompts;
create policy "own rows: select" on public.prompts
  for select using (auth.uid() = user_id);

drop policy if exists "own rows: insert" on public.prompts;
create policy "own rows: insert" on public.prompts
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows: update" on public.prompts;
create policy "own rows: update" on public.prompts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows: delete" on public.prompts;
create policy "own rows: delete" on public.prompts
  for delete using (auth.uid() = user_id);
