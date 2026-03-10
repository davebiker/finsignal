-- ============================================================
-- Profiles table with admin approval flow
-- ============================================================

-- Create profiles table mirroring auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user',
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-approve the superadmin
-- Any existing user with this email gets approved immediately
-- New signups will be handled by the trigger below

-- RLS policies
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Only service role can insert/update (via trigger + admin API)
-- No insert/update policies for anon/authenticated — admin API uses service role

-- Trigger: auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, approved)
  values (
    new.id,
    new.email,
    case when new.email = 'david@beska.cz' then 'admin' else 'user' end,
    case when new.email = 'david@beska.cz' then true else false end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Index for quick lookups
create index if not exists idx_profiles_approved on public.profiles(approved);
create index if not exists idx_profiles_email on public.profiles(email);
