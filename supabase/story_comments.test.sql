-- Run this in the Supabase SQL editor only after supabase/story_comments.sql has committed.
-- Then run supabase/story_comments.sql a second time and run the read-only checks at the bottom.
-- This behavior test rolls back. It does not keep comments or change profiles.
-- It needs two existing profiles and the sample story alex-monday.

begin;

do $test$
declare
  person_a uuid;
  person_b uuid;
  name_a text;
  footprint_a jsonb;
  profile_count integer;
  story_count integer;
  comment_count integer;
  parent_comment uuid;
  reply_comment uuid;
  nested_id uuid;
  reply_body text;
  reply_author uuid;
begin
  select count(*) into profile_count from public.profiles;
  select count(*) into story_count from public.sample_stories;
  select count(*) into comment_count from public.story_comments;

  select id, display_name, footprint
    into person_a, name_a, footprint_a
  from public.profiles
  order by id
  limit 1;

  select id into person_b
  from public.profiles
  where id <> person_a
  order by id
  limit 1;

  if person_a is null or person_b is null then
    raise exception 'Comment tests need two profiles.';
  end if;

  if not exists (select 1 from public.sample_stories where id = 'alex-monday') then
    raise exception 'Sample story alex-monday is missing. Run supabase/story_comments.sql first.';
  end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', person_a::text, true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', person_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  insert into public.story_comments (story_id, author_id, body)
  values ('alex-monday', person_a, '  A top-level comment  ')
  returning id into parent_comment;

  if parent_comment is null
     or (select body from public.story_comments where id = parent_comment) <> 'A top-level comment'
     or (select author_name from public.story_comments where id = parent_comment)
        <> left(coalesce(nullif(btrim(name_a), ''), 'Member'), 80) then
    raise exception 'Creating a comment did not save the trimmed text and profile name.';
  end if;

  begin
    insert into public.story_comments (story_id, author_id, body)
    values ('alex-monday', person_b, 'Posted as someone else');
    raise exception 'A comment was saved with another person''s author_id.';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm not like '%Sign in to comment as yourself%' then
        raise;
      end if;
  end;

  execute 'reset role';
  perform pg_catalog.set_config('request.jwt.claim.sub', person_b::text, true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', person_b, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  insert into public.story_comments (story_id, author_id, parent_id, body)
  values ('alex-monday', person_b, parent_comment, 'A reply')
  returning id into reply_comment;

  begin
    insert into public.story_comments (story_id, author_id, parent_id, body)
    values ('alex-monday', person_b, reply_comment, 'A reply to a reply')
    returning id into nested_id;
    raise exception 'A reply to another reply was saved.';
  exception
    when others then
      if sqlerrm not like '%Replies answer one comment on the same story%' then
        raise;
      end if;
  end;

  update public.story_comments
  set body = 'stolen'
  where id = parent_comment;
  if found or (select body from public.story_comments where id = parent_comment) = 'stolen' then
    raise exception 'Someone edited another person''s comment.';
  end if;

  update public.story_comments
  set deleted_at = now()
  where id = parent_comment;
  if found
     or (select body from public.story_comments where id = parent_comment) = 'This comment was deleted' then
    raise exception 'Someone hid another person''s comment.';
  end if;

  begin
    delete from public.story_comments where id = parent_comment;
    raise exception 'A signed-in user removed a comment row.';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    update public.story_comments
    set parent_id = null
    where id = reply_comment;
    raise exception 'parent_id was changed.';
  exception
    when others then
      if sqlerrm not like '%cannot be changed%' then
        raise;
      end if;
  end;

  execute 'reset role';
  perform pg_catalog.set_config('request.jwt.claim.sub', person_a::text, true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', person_a, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';

  update public.story_comments
  set body = 'Edited comment'
  where id = parent_comment;
  if not found or (select body from public.story_comments where id = parent_comment) <> 'Edited comment' then
    raise exception 'The author could not edit their own comment.';
  end if;

  begin
    update public.story_comments
    set story_id = 'jamie-waste'
    where id = parent_comment;
    raise exception 'story_id was changed.';
  exception
    when others then
      if sqlerrm not like '%cannot be changed%' then
        raise;
      end if;
  end;

  begin
    update public.story_comments
    set author_id = person_b
    where id = parent_comment;
    raise exception 'author_id was changed.';
  exception
    when others then
      if sqlerrm not like '%cannot be changed%' and sqlerrm not like '%row-level security%' then
        raise;
      end if;
  end;

  update public.story_comments
  set deleted_at = now()
  where id = parent_comment;
  select body, author_id into reply_body, reply_author
  from public.story_comments
  where id = reply_comment;

  if not exists (select 1 from public.story_comments where id = parent_comment)
     or (select body from public.story_comments where id = parent_comment) <> 'This comment was deleted'
     or (select deleted_at from public.story_comments where id = parent_comment) is null
     or not exists (select 1 from public.story_comments where id = reply_comment)
     or reply_body <> 'A reply'
     or reply_author <> person_b
     or (select comment.parent_id from public.story_comments as comment where comment.id = reply_comment) is distinct from parent_comment then
    raise exception 'Hiding the parent removed the row or changed the other person''s reply.';
  end if;

  begin
    update public.story_comments
    set body = 'Restored'
    where id = parent_comment;
    raise exception 'A deleted comment was edited.';
  exception
    when others then
      if sqlerrm not like '%deleted comment cannot be changed%' then
        raise;
      end if;
  end;

  execute 'reset role';

  if (select count(*) from public.profiles) <> profile_count
     or (select footprint from public.profiles where id = person_a) is distinct from footprint_a
     or (select display_name from public.profiles where id = person_a) is distinct from name_a
     or (select count(*) from public.sample_stories) <> story_count then
    raise exception 'Profiles, footprints, or stories changed during the comment test.';
  end if;

  if (select count(*) from public.story_comments) <> comment_count + 2 then
    raise exception 'Hiding a comment removed a row.';
  end if;
end
$test$;

rollback;

-- After this file rolls back, run supabase/story_comments.sql a second time.
-- Profiles, footprints, stories, and comments must be unchanged.
-- Then run these read-only checks. They should return the rows described below
-- and no other parent_id foreign key.

-- select count(*) as profiles from public.profiles;
-- select count(*) as stories from public.sample_stories;
-- select count(*) as comments from public.story_comments;
--
-- select polname, polcmd, polpermissive
-- from pg_policy
-- where polrelid in ('public.sample_stories'::regclass, 'public.story_comments'::regclass)
-- order by 1;
-- Expect at least: Read sample stories, Read story comments,
-- Insert own story comment, and Update own story comment.
-- There should be no "Delete own story comment" policy.
--
-- select pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.story_comments'::regclass
--   and contype = 'f'
--   and conname = 'story_comments_parent_id_fkey';
-- Expect one row containing ON DELETE SET NULL.
--
-- select proname
-- from pg_proc
-- where pronamespace = 'public'::regnamespace
--   and proname = 'reply_link_is_being_cleared';
-- Expect zero rows.
