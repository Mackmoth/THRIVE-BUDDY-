
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age int,
  interests text[] default '{}',
  avatar_emoji text default '🚀',
  xp int not null default 0,
  level int not null default 1,
  streak_days int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- GOALS
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'personal',
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals self all" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MISSIONS
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  title text not null,
  description text,
  xp_reward int not null default 20,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.missions enable row level security;
create policy "missions self all" on public.missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHAT MESSAGES
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  parts jsonb,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "chat self all" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index chat_messages_user_created on public.chat_messages(user_id, created_at);

-- COMMUNITY POSTS
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
create policy "community read all authed" on public.community_posts for select using (auth.role() = 'authenticated');
create policy "community insert self" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "community delete own" on public.community_posts for delete using (auth.uid() = user_id);

-- QUIZ ATTEMPTS
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text not null,
  score int not null default 0,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
create policy "quiz self all" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PROGRESS SCORES
create table public.progress_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  health int not null default 10,
  learning int not null default 10,
  confidence int not null default 10,
  community int not null default 10,
  updated_at timestamptz not null default now()
);
alter table public.progress_scores enable row level security;
create policy "progress self read" on public.progress_scores for select using (auth.uid() = user_id);
create policy "progress self insert" on public.progress_scores for insert with check (auth.uid() = user_id);
create policy "progress self update" on public.progress_scores for update using (auth.uid() = user_id);

-- Auto-create profile + progress on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.progress_scores (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
