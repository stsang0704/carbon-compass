-- Run this whole file once in the Supabase SQL editor. It is one transaction.
-- If any check fails, the transaction rolls back and no change is kept.
--
-- This script reads public.profiles. It does not modify profiles or footprint data.
-- The reads are:
--   1. A before-and-after snapshot, so the transaction can abort if a profile changed.
--   2. On a later comment insert, the trigger reads that person's display_name.
-- It does not DELETE, UPDATE, or TRUNCATE profiles, footprints, sample stories, or comments.
--
-- While the transaction runs it takes a brief lock that makes profile, story, and
-- comment writes wait. Those writes are not discarded. They continue after commit.
--
-- Objects this script may replace, without changing row data:
--   table privileges for anon, public, and authenticated on these two tables
--   only these named policies: "Read sample stories", "Read story comments",
--   "Insert own story comment", and "Update own story comment"
--   the named policy "Delete own story comment", which this script drops because
--   hiding a comment is now an update, not a row delete
--   public.enforce_story_comment() and its trigger
--   public.reply_link_is_being_cleared(public.story_comments, public.story_comments),
--   which this script drops if an earlier draft created it
--   the parent_id foreign key, and only when it is missing or is not ON DELETE SET NULL
-- Policies on other tables, and any other policy on these tables, are left in place.
-- A hidden comment keeps its row. Its text becomes "This comment was deleted",
-- and replies continue to point at it.
--
-- The comparison copies live in schema story_comments_migration_check.
-- They are not temporary tables: the SQL Editor can commit before the final
-- check, and ON COMMIT DROP would remove a temporary copy at that commit.
-- The script never drops that schema. It removes only its own three snapshot
-- tables, and it stops if the schema already holds anything else.

begin;

create table if not exists public.sample_stories (
  id text primary key,
  is_sample boolean not null default true,
  author_id uuid references public.profiles (id) on delete set null
);

create table if not exists public.story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id text not null references public.sample_stories (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid,
  body text not null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_comments_body_len check (char_length(btrim(body)) between 1 and 500)
);

alter table public.story_comments
  add column if not exists deleted_at timestamptz;

lock table public.profiles in share mode;
lock table public.sample_stories in share row exclusive mode;
lock table public.story_comments in share row exclusive mode;

-- Do not drop the schema. Another project may already be using that name.
-- Stop when it contains anything besides this script's three snapshot tables.
do $$
declare
  other_object text;
begin
  if pg_catalog.to_regnamespace('story_comments_migration_check') is null then
    create schema story_comments_migration_check;
    revoke all on schema story_comments_migration_check from public, anon, authenticated;
    return;
  end if;

  select pg_catalog.string_agg(format('%s %I', c.relkind, c.relname), ', ' order by c.relname)
  into other_object
  from pg_class as c
  join pg_namespace as n on n.oid = c.relnamespace
  where n.nspname = 'story_comments_migration_check'
    and (
      (
        c.relkind not in ('i', 'I', 't')
        and c.relname not in ('profile_snapshot', 'comment_snapshot', 'sample_story_snapshot')
      )
      or (
        c.relkind in ('i', 'I', 't')
        and not exists (
          select 1
          from pg_depend as dependency
          join pg_class as parent on parent.oid = dependency.refobjid
          where dependency.classid = 'pg_class'::regclass
            and dependency.objid = c.oid
            and dependency.refclassid = 'pg_class'::regclass
            and parent.relnamespace = n.oid
            and parent.relname in ('profile_snapshot', 'comment_snapshot', 'sample_story_snapshot')
        )
      )
    );

  if other_object is null then
    select pg_catalog.string_agg(routine.proname, ', ' order by routine.proname)
    into other_object
    from pg_proc as routine
    join pg_namespace as n on n.oid = routine.pronamespace
    where n.nspname = 'story_comments_migration_check';
  end if;

  if other_object is null then
    select pg_catalog.string_agg(created_type.typname, ', ' order by created_type.typname)
    into other_object
    from pg_type as created_type
    join pg_namespace as n on n.oid = created_type.typnamespace
    where n.nspname = 'story_comments_migration_check'
      and created_type.typname not in (
        'profile_snapshot', 'comment_snapshot', 'sample_story_snapshot',
        '_profile_snapshot', '_comment_snapshot', '_sample_story_snapshot'
      );
  end if;

  if other_object is not null then
    raise exception 'Schema story_comments_migration_check already contains other objects (%). Nothing was dropped.', other_object;
  end if;
end $$;

drop table if exists story_comments_migration_check.profile_snapshot;
drop table if exists story_comments_migration_check.comment_snapshot;
drop table if exists story_comments_migration_check.sample_story_snapshot;

create table story_comments_migration_check.profile_snapshot as
  select id, display_name, footprint, updated_at
  from public.profiles;

create table story_comments_migration_check.comment_snapshot as
  select id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at
  from public.story_comments;

create table story_comments_migration_check.sample_story_snapshot as
  select id, is_sample, author_id
  from public.sample_stories;

revoke all on all tables in schema story_comments_migration_check from public, anon, authenticated;

-- Add missing sample story ids only. An existing row keeps is_sample and author_id.
insert into public.sample_stories (id, is_sample, author_id)
values
  ('alex-monday', true, null),
  ('jamie-waste', true, null),
  ('lina-october', true, null),
  ('maya-repair', true, null),
  ('sarah-meals', true, null),
  ('kevin-flights', true, null),
  ('sam-thermostat', true, null)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from public.sample_stories as story
    join story_comments_migration_check.sample_story_snapshot as snap on snap.id = story.id
    where story.is_sample is distinct from snap.is_sample
       or story.author_id is distinct from snap.author_id
  ) then
    raise exception 'Existing sample stories were modified. Rolling back.';
  end if;

  if exists (
    select id from story_comments_migration_check.sample_story_snapshot
    except
    select id from public.sample_stories
  ) then
    raise exception 'A sample story was deleted. Rolling back.';
  end if;
end $$;

-- parent_id must use ON DELETE SET NULL so a deleted comment does not delete replies.
-- If that foreign key is already correct, leave it. Drop and recreate it only when
-- it is missing, points elsewhere, or would delete the reply rows.
do $$
declare
  fk record;
  kept boolean := false;
  referenced_column text;
  definition text;
begin
  for fk in
    select distinct on (c.oid)
      c.oid, c.conname, c.confdeltype, c.confrelid, c.conkey, c.confkey
    from pg_constraint as c
    join pg_attribute as local_column
      on local_column.attrelid = c.conrelid
     and local_column.attnum = any (c.conkey)
    where c.conrelid = 'public.story_comments'::regclass
      and c.contype = 'f'
      and local_column.attname = 'parent_id'
    order by c.oid
  loop
    select referenced.attname
      into referenced_column
    from pg_attribute as referenced
    where referenced.attrelid = fk.confrelid
      and referenced.attnum = fk.confkey[1];

    definition := pg_get_constraintdef(fk.oid);

    if not kept
       and array_length(fk.conkey, 1) = 1
       and fk.confrelid = 'public.story_comments'::regclass
       and fk.confdeltype = 'n'
       and referenced_column = 'id'
       and definition ilike '%ON DELETE SET NULL%'
    then
      kept := true;
      continue;
    end if;

    execute format('alter table public.story_comments drop constraint %I', fk.conname);
  end loop;

  if not kept then
    alter table public.story_comments
      add constraint story_comments_parent_id_fkey
      foreign key (parent_id)
      references public.story_comments (id)
      on delete set null;
  end if;
end $$;

create index if not exists story_comments_story_idx
  on public.story_comments (story_id, created_at);

alter table public.sample_stories enable row level security;
alter table public.story_comments enable row level security;

-- Signed-in people can read, add, and update comments. They cannot remove a row.
-- Hiding a comment sets deleted_at on their own row.

revoke all on table public.sample_stories from public, anon, authenticated;
grant select on table public.sample_stories to authenticated;

revoke all on table public.story_comments from public, anon, authenticated;
grant select, insert, update on table public.story_comments to authenticated;

-- Replace only the policies named below. Other policies are not dropped.
drop policy if exists "Read sample stories" on public.sample_stories;
create policy "Read sample stories"
  on public.sample_stories
  for select
  to authenticated
  using (true);

drop policy if exists "Read story comments" on public.story_comments;
create policy "Read story comments"
  on public.story_comments
  for select
  to authenticated
  using (true);

drop policy if exists "Insert own story comment" on public.story_comments;
create policy "Insert own story comment"
  on public.story_comments
  for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Update own story comment" on public.story_comments;
create policy "Update own story comment"
  on public.story_comments
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "Delete own story comment" on public.story_comments;

do $$
declare
  unsafe_policy text;
  grant_problem text;
begin
  -- Leave unrelated policies in place. PostgreSQL stores a PUBLIC policy as
  -- role id 0, not as an empty role list and not as a row in pg_roles.
  -- Stop when a permissive policy applies to any role other than authenticated,
  -- or when a write policy is broader than updating or inserting one's own comment.
  select string_agg(
    format('%s.%I', child.relname, policy.polname),
    ', ' order by child.relname, policy.polname
  )
  into unsafe_policy
  from pg_policy as policy
  join pg_class as child on child.oid = policy.polrelid
  join pg_namespace as schema on schema.oid = child.relnamespace
  where schema.nspname = 'public'
    and child.relname in ('sample_stories', 'story_comments')
    and policy.polpermissive
    and (
      cardinality(policy.polroles) = 0
      or 0 = any (policy.polroles)
      or exists (
        select 1
        from pg_catalog.unnest(policy.polroles) as role_id
        where role_id is distinct from (
          select granted_role.oid
          from pg_roles as granted_role
          where granted_role.rolname = 'authenticated'
        )
      )
      or exists (
        select 1
        from pg_roles as granted_role
        where granted_role.oid = any (policy.polroles)
          and granted_role.rolname in ('anon', 'public')
      )
      or (
        policy.polcmd in ('*', 'a', 'w', 'd')
        and not (
          child.relname = 'story_comments'
          and policy.polname in (
            'Insert own story comment',
            'Update own story comment'
          )
        )
      )
    );

  if unsafe_policy is not null then
    raise exception 'A permissive policy would widen comment access: %. It was not dropped. Rolling back.', unsafe_policy;
  end if;

  select string_agg(
    format('%s %s %s', grantee, privilege_type, table_name),
    ', ' order by table_name, grantee, privilege_type
  )
  into grant_problem
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('sample_stories', 'story_comments')
    and grantee in ('anon', 'PUBLIC', 'authenticated')
    and not (
      (grantee = 'authenticated' and table_name = 'sample_stories' and privilege_type = 'SELECT')
      or (
        grantee = 'authenticated'
        and table_name = 'story_comments'
        and privilege_type in ('SELECT', 'INSERT', 'UPDATE')
      )
    );

  if grant_problem is not null then
    raise exception 'Unexpected table grants: %. Rolling back.', grant_problem;
  end if;
end $$;

-- An earlier draft added this helper. Drop that function only. It is not recreated.
drop function if exists public.reply_link_is_being_cleared(public.story_comments, public.story_comments);

create or replace function public.enforce_story_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.story_comments;
  known_name text;
begin
  if tg_op = 'UPDATE'
     and (
       new.id is distinct from old.id
       or new.story_id is distinct from old.story_id
       or new.author_id is distinct from old.author_id
       or new.parent_id is distinct from old.parent_id
       or new.author_name is distinct from old.author_name
       or new.created_at is distinct from old.created_at
     )
  then
    raise exception 'parent_id, author_id, and story_id cannot be changed';
  end if;

  if auth.uid() is null or new.author_id is distinct from auth.uid() then
    raise exception 'Sign in to comment as yourself';
  end if;

  new.body := pg_catalog.btrim(new.body);

  if tg_op = 'INSERT' then
    new.deleted_at := null;
    select display_name into known_name from public.profiles where id = auth.uid();
    known_name := pg_catalog.btrim(known_name);
    if known_name is null or known_name = ''::text then
      known_name := 'Member';
    end if;
    new.author_name := pg_catalog.left(known_name, 80);
    new.created_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();

    if new.parent_id is not null then
      select * into parent from public.story_comments where id = new.parent_id;
      if not found
         or parent.story_id is distinct from new.story_id
         or parent.parent_id is not null then
        raise exception 'Replies answer one comment on the same story';
      end if;
    end if;
    return new;
  end if;

  if old.deleted_at is not null then
    raise exception 'A deleted comment cannot be changed';
  end if;

  if new.deleted_at is not null then
    new.deleted_at := pg_catalog.now();
    new.body := 'This comment was deleted';
    new.updated_at := pg_catalog.now();
    return new;
  end if;

  new.deleted_at := null;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.enforce_story_comment() from public, anon, authenticated;
grant execute on function public.enforce_story_comment() to authenticated, service_role;

drop trigger if exists story_comments_enforce on public.story_comments;
create trigger story_comments_enforce
  before insert or update on public.story_comments
  for each row
  execute function public.enforce_story_comment();

do $$
begin
  if exists (
    (
      select id, display_name, footprint, updated_at from public.profiles
      except
      select id, display_name, footprint, updated_at from story_comments_migration_check.profile_snapshot
    )
    union all
    (
      select id, display_name, footprint, updated_at from story_comments_migration_check.profile_snapshot
      except
      select id, display_name, footprint, updated_at from public.profiles
    )
  ) then
    raise exception 'Profile or footprint data changed. Rolling back.';
  end if;

  if exists (
    (
      select id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at
      from public.story_comments
      except
      select id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at
      from story_comments_migration_check.comment_snapshot
    )
    union all
    (
      select id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at
      from story_comments_migration_check.comment_snapshot
      except
      select id, story_id, author_id, parent_id, body, author_name, created_at, updated_at, deleted_at
      from public.story_comments
    )
  ) then
    raise exception 'Existing comments changed. Rolling back.';
  end if;

  if exists (
    select 1
    from public.sample_stories as story
    join story_comments_migration_check.sample_story_snapshot as snap on snap.id = story.id
    where story.is_sample is distinct from snap.is_sample
       or story.author_id is distinct from snap.author_id
  ) or exists (
    select id from story_comments_migration_check.sample_story_snapshot
    except
    select id from public.sample_stories
  ) then
    raise exception 'Existing sample stories changed. Rolling back.';
  end if;
end $$;

drop table if exists story_comments_migration_check.profile_snapshot;
drop table if exists story_comments_migration_check.comment_snapshot;
drop table if exists story_comments_migration_check.sample_story_snapshot;

notify pgrst, 'reload schema';

commit;
