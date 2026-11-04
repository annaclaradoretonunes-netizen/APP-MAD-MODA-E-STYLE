-- MAD 1.0: execute este arquivo no SQL Editor do Supabase.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'MAD Lover' check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 200),
  created_at timestamptz not null default now()
);
create table if not exists public.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now()
);
create or replace function public.create_mad_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  if new.raw_user_meta_data ->> 'mad_accepted' = 'true' then
    insert into public.consent_events (user_id, terms_version, privacy_version)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'terms_version','unknown'),
            coalesce(new.raw_user_meta_data ->> 'privacy_version','unknown'));
  end if;
  return new;
end;
$$;
drop trigger if exists on_mad_auth_user_created on auth.users;
create trigger on_mad_auth_user_created after insert on auth.users
for each row execute procedure public.create_mad_profile();
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

create table if not exists public.looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 500),
  aesthetic text not null default 'Y2K' check (char_length(aesthetic) <= 40),
  photo_path text not null check (char_length(photo_path) <= 350),
  item_name text check (char_length(item_name) <= 100),
  brand text check (char_length(brand) <= 100),
  price_brl numeric(12,2) check (price_brl is null or price_brl >= 0),
  item_url text check (item_url is null or item_url ~* '^https://[^ ]+$'),
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists mad_looks_recent on public.looks(created_at desc);
create index if not exists mad_looks_user on public.looks(user_id);

create table if not exists public.saved_looks (
  user_id uuid not null references auth.users(id) on delete cascade,
  look_id uuid not null references public.looks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, look_id)
);

alter table public.profiles enable row level security;
alter table public.consent_events enable row level security;
alter table public.looks enable row level security;
alter table public.saved_looks enable row level security;
drop policy if exists "profiles_read_auth" on public.profiles;
create policy "profiles_read_auth" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "consents_read_own" on public.consent_events;
create policy "consents_read_own" on public.consent_events for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "consents_insert_own" on public.consent_events;
create policy "consents_insert_own" on public.consent_events for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "looks_read_published" on public.looks;
create policy "looks_read_published" on public.looks for select to authenticated
using (published = true or (select auth.uid()) = user_id);
drop policy if exists "looks_insert_own" on public.looks;
create policy "looks_insert_own" on public.looks for insert to authenticated
with check ((select auth.uid()) = user_id and split_part(photo_path, '/', 1) = (select auth.uid())::text);
drop policy if exists "looks_update_own" on public.looks;
create policy "looks_update_own" on public.looks for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and split_part(photo_path, '/', 1) = (select auth.uid())::text);
drop policy if exists "looks_delete_own" on public.looks;
create policy "looks_delete_own" on public.looks for delete to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "saved_read_own" on public.saved_looks;
create policy "saved_read_own" on public.saved_looks for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "saved_insert_own" on public.saved_looks;
create policy "saved_insert_own" on public.saved_looks for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "saved_delete_own" on public.saved_looks;
create policy "saved_delete_own" on public.saved_looks for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('looks','looks',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "mad_images_read_auth" on storage.objects;
create policy "mad_images_read_auth" on storage.objects for select to authenticated
using (bucket_id = 'looks');
drop policy if exists "mad_images_upload_own" on storage.objects;
create policy "mad_images_upload_own" on storage.objects for insert to authenticated
with check (bucket_id = 'looks' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "mad_images_delete_own" on storage.objects;
create policy "mad_images_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'looks' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Antes de lançamento público: moderação, denúncias, bloqueio, exclusão de conta e LGPD.
