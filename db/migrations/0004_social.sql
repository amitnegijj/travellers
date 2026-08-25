-- 0004_social.sql — follow, like, comment, save
-- Counters are maintained by trigger here: atomic, and far less code than
-- use-case increments + reconciliation at this scale. Revisit if writes get hot.

create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index follows_following_ix on follows (following_id, created_at desc);

create table likes (
  profile_id uuid not null references profiles(id) on delete cascade,
  journey_id uuid not null references journeys(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, journey_id)
);
create index likes_journey_ix on likes (journey_id);

create table saves (
  profile_id uuid not null references profiles(id) on delete cascade,
  journey_id uuid not null references journeys(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, journey_id)
);
create index saves_profile_ix on saves (profile_id, created_at desc);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index comments_journey_ix on comments (journey_id, created_at desc) where deleted_at is null;

-- ------------------------------------------------------------ stat triggers

create or replace function bump_like_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update journey_stats set like_count = like_count + 1 where journey_id = new.journey_id;
  else
    update journey_stats set like_count = greatest(like_count - 1, 0) where journey_id = old.journey_id;
  end if;
  return null;
end $$;

create trigger likes_count after insert or delete on likes
  for each row execute function bump_like_count();

create or replace function bump_save_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update journey_stats set save_count = save_count + 1 where journey_id = new.journey_id;
  else
    update journey_stats set save_count = greatest(save_count - 1, 0) where journey_id = old.journey_id;
  end if;
  return null;
end $$;

create trigger saves_count after insert or delete on saves
  for each row execute function bump_save_count();

create or replace function bump_comment_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update journey_stats set comment_count = comment_count + 1 where journey_id = new.journey_id;
  elsif tg_op = 'DELETE' then
    update journey_stats set comment_count = greatest(comment_count - 1, 0) where journey_id = old.journey_id;
  elsif old.deleted_at is null and new.deleted_at is not null then
    update journey_stats set comment_count = greatest(comment_count - 1, 0) where journey_id = new.journey_id;
  end if;
  return null;
end $$;

create trigger comments_count after insert or delete or update of deleted_at on comments
  for each row execute function bump_comment_count();
