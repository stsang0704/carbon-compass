-- Optional photos for stories a signed-in person shares on Together.
-- Run this whole file once in the Supabase SQL editor. It is one transaction.
--
-- It does not change story_comments, profiles, footprint data, or sample story rows.
-- It adds a community_stories table, lets a person insert their own non-sample
-- story id so comments can point at it, and creates a private story-photos bucket.
--
-- Do not re-run supabase/story_comments.sql after this. That older script treats a
-- new write policy on sample_stories as unsafe and will roll its own transaction
-- back. Your data stays, but the re-run stops with an error.
--
-- After this succeeds, no new environment variable is required. The app already
-- uses the public anon key and the signed-in session.

begin;

create table if not exists public.community_stories (
  id text primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null default '',
  title text not null,
  caption text not null default '',
  category text not null,
  photo_path text,
  created_at timestamptz not null default now(),
  constraint community_stories_title_len check (char_length(btrim(title)) between 1 and 80),
  constraint community_stories_caption_len check (char_length(caption) <= 280),
  constraint community_stories_name_len check (char_length(author_name) <= 80),
  constraint community_stories_category check (category in ('food', 'travel', 'home', 'stuff')),
  constraint community_stories_photo_path check (
    photo_path is null
    or photo_path = author_id::text || '/' || id || '.jpg'
    or photo_path = author_id::text || '/' || id || '.png'
    or photo_path = author_id::text || '/' || id || '.webp'
  ),
  constraint community_stories_anchor
    foreign key (id) references public.sample_stories (id) on delete cascade
);

create index if not exists community_stories_created_idx
  on public.community_stories (created_at desc);

alter table public.community_stories enable row level security;

revoke all on table public.community_stories from public, anon, authenticated;
grant select, insert, update, delete on table public.community_stories to authenticated;

drop policy if exists "Read community stories" on public.community_stories;
create policy "Read community stories"
  on public.community_stories
  for select
  to authenticated
  using (true);

drop policy if exists "Insert own community story" on public.community_stories;
create policy "Insert own community story"
  on public.community_stories
  for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Update own community story" on public.community_stories;
create policy "Update own community story"
  on public.community_stories
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "Delete own community story" on public.community_stories;
create policy "Delete own community story"
  on public.community_stories
  for delete
  to authenticated
  using (author_id = auth.uid());

-- Comments already reference sample_stories. A shared story needs its own id
-- there, and only that author may add or remove a non-sample id.
grant insert, delete on table public.sample_stories to authenticated;

drop policy if exists "Insert own story anchor" on public.sample_stories;
create policy "Insert own story anchor"
  on public.sample_stories
  for insert
  to authenticated
  with check (author_id = auth.uid() and is_sample = false);

drop policy if exists "Delete own story anchor" on public.sample_stories;
create policy "Delete own story anchor"
  on public.sample_stories
  for delete
  to authenticated
  using (author_id = auth.uid() and is_sample = false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-photos',
  'story-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Read story photos" on storage.objects;
create policy "Read story photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'story-photos');

drop policy if exists "Upload own story photo" on storage.objects;
create policy "Upload own story photo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'story-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) <> ''
    and split_part(name, '/', 3) = ''
    and lower(split_part(name, '.', 2)) in ('jpg', 'png', 'webp')
  );

drop policy if exists "Replace own story photo" on storage.objects;
create policy "Replace own story photo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'story-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'story-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Delete own story photo" on storage.objects;
create policy "Delete own story photo"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'story-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

notify pgrst, 'reload schema';

commit;
