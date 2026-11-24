-- Profile photos for the signed-in person.
-- Run this whole file once in the Supabase SQL editor. It is one transaction.
--
-- It adds a nullable avatar_path column to public.profiles and a private
-- profile-photos bucket. Existing display names, footprints, and profile rows
-- are not rewritten. Until someone saves a photo, avatar_path stays empty.
--
-- A person can read, upload, replace, and delete only the avatar file in their
-- own folder. No new environment variable is required.

begin;

alter table public.profiles
  add column if not exists avatar_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_path_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_path_check
      check (
        avatar_path is null
        or avatar_path = id::text || '/avatar.jpg'
        or avatar_path = id::text || '/avatar.png'
        or avatar_path = id::text || '/avatar.webp'
      );
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Read own profile photo" on storage.objects;
create policy "Read own profile photo"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) in ('avatar.jpg', 'avatar.png', 'avatar.webp')
    and split_part(name, '/', 3) = ''
  );

drop policy if exists "Upload own profile photo" on storage.objects;
create policy "Upload own profile photo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) in ('avatar.jpg', 'avatar.png', 'avatar.webp')
    and split_part(name, '/', 3) = ''
  );

drop policy if exists "Replace own profile photo" on storage.objects;
create policy "Replace own profile photo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) in ('avatar.jpg', 'avatar.png', 'avatar.webp')
    and split_part(name, '/', 3) = ''
  )
  with check (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) in ('avatar.jpg', 'avatar.png', 'avatar.webp')
    and split_part(name, '/', 3) = ''
  );

drop policy if exists "Delete own profile photo" on storage.objects;
create policy "Delete own profile photo"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) in ('avatar.jpg', 'avatar.png', 'avatar.webp')
    and split_part(name, '/', 3) = ''
  );

notify pgrst, 'reload schema';

commit;
