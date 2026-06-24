import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

const isUrlValid = (url: string) => {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  isUrlValid(supabaseUrl)
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Provide SQL instructions for the user to copy/paste into Supabase SQL Editor
export const SQL_SCHEMA = `-- Drop existing tables if they already exist to prevent "relation already exists" errors
drop table if exists public.tasks cascade;
drop table if exists public.subjects cascade;

-- Create subjects table
create table public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table with due_date to support "Due Soon" filtering
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  priority integer not null check (priority between 1 and 3), -- 1 = Low, 2 = Medium, 3 = High
  status text not null default 'pending', -- 'pending' or 'done'
  order_index integer not null default 0,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;

-- Create policies for subjects
create policy "subjects_select" on public.subjects for select using (auth.uid() = user_id);
create policy "subjects_insert" on public.subjects for insert with check (auth.uid() = user_id);
create policy "subjects_update" on public.subjects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subjects_delete" on public.subjects for delete using (auth.uid() = user_id);

-- Create policies for tasks (verifying subject folder ownership)
create policy "tasks_select" on public.tasks for select using (
  exists (
    select 1 from public.subjects
    where subjects.id = tasks.subject_id
    and subjects.user_id = auth.uid()
  )
);

create policy "tasks_insert" on public.tasks for insert with check (
  exists (
    select 1 from public.subjects
    where subjects.id = tasks.subject_id
    and subjects.user_id = auth.uid()
  )
);

create policy "tasks_update" on public.tasks for update using (
  exists (
    select 1 from public.subjects
    where subjects.id = tasks.subject_id
    and subjects.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.subjects
    where subjects.id = tasks.subject_id
    and subjects.user_id = auth.uid()
  )
);

create policy "tasks_delete" on public.tasks for delete using (
  exists (
    select 1 from public.subjects
    where subjects.id = tasks.subject_id
    and subjects.user_id = auth.uid()
  )
);
`;
