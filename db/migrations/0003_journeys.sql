-- 0003_journeys.sql — journeys, stops, expenses, media, versions, stats
-- Money is ALWAYS integer minor units + a currency code. Never float.

create type journey_status  as enum ('draft', 'ready', 'published', 'archived');
create type journey_visibility as enum ('public', 'followers', 'private');
create type expense_category as enum
  ('fuel', 'food', 'stay', 'tolls', 'tickets', 'activities', 'transport', 'other');
create type tip_kind as enum ('tip', 'warning');

create table media (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  url        text not null,
  mime       text not null,
  width      integer,
  height     integer,
  bytes      integer,
  created_at timestamptz not null default now()
);
create index media_owner_ix on media (owner_id);

create table journeys (
  id                  uuid primary key default gen_random_uuid(),
  author_id           uuid not null references profiles(id) on delete cascade,
  title               text not null,
  summary             text,
  cover_url           text,

  origin_name         text,
  origin_point        geography(Point, 4326),
  destination_name    text,
  destination_point   geography(Point, 4326),
  destination_id      uuid references destinations(id) on delete set null,

  -- Simplified geometry only. Full-fidelity track belongs in object storage.
  route_simplified    geography(LineString, 4326),

  distance_m          integer,
  duration_min        integer,
  start_date          date,
  end_date            date,

  travel_style        text,
  difficulty          text,
  vehicle             text,
  best_season         text[] not null default '{}',

  status              journey_status not null default 'draft',
  -- Denormalized from the author's profile so feed RLS/filters stay single-table.
  visibility          journey_visibility not null default 'public',

  total_expense_minor bigint not null default 0,
  currency            char(3) not null default 'INR',
  completeness        integer not null default 0,

  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(origin_name, '') || ' ' ||
                                     coalesce(destination_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'C')
  ) stored,

  constraint journey_dates_ordered check (end_date is null or start_date is null or end_date >= start_date)
);

-- Feed cursor is (created_at, id); published feed is the hot path.
create index journeys_feed_ix     on journeys (published_at desc, id desc) where status = 'published';
create index journeys_author_ix   on journeys (author_id, created_at desc);
create index journeys_dest_ix     on journeys (destination_id) where status = 'published';
create index journeys_route_gix   on journeys using gist (route_simplified);
create index journeys_destpt_gix  on journeys using gist (destination_point);
create index journeys_tsv         on journeys using gin (search_tsv);

create trigger journeys_touch before update on journeys
  for each row execute function touch_updated_at();

-- Immutable snapshot per publish. Editing a published journey never destroys it.
create table journey_versions (
  journey_id   uuid not null references journeys(id) on delete cascade,
  version      integer not null,
  snapshot     jsonb not null,
  published_at timestamptz not null default now(),
  primary key (journey_id, version)
);

create table journey_stops (
  id         uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  place_id   uuid references places(id) on delete set null,
  position   integer not null,
  name       text not null,
  note       text,
  location   geography(Point, 4326),
  arrived_on date,
  created_at timestamptz not null default now()
);
create index journey_stops_journey_ix on journey_stops (journey_id, position);

create table journey_expenses (
  id           uuid primary key default gen_random_uuid(),
  journey_id   uuid not null references journeys(id) on delete cascade,
  category     expense_category not null default 'other',
  label        text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency     char(3) not null default 'INR',
  spent_on     date,
  created_at   timestamptz not null default now()
);
create index journey_expenses_journey_ix on journey_expenses (journey_id);

create table journey_tips (
  id         uuid primary key default gen_random_uuid(),
  journey_id uuid not null references journeys(id) on delete cascade,
  kind       tip_kind not null default 'tip',
  body       text not null,
  created_at timestamptz not null default now()
);
create index journey_tips_journey_ix on journey_tips (journey_id);

create table journey_media (
  journey_id uuid not null references journeys(id) on delete cascade,
  media_id   uuid not null references media(id) on delete cascade,
  position   integer not null default 0,
  primary key (journey_id, media_id)
);
create index journey_media_journey_ix on journey_media (journey_id, position);

-- Hot counters live off the main row to avoid write amplification / bloat.
create table journey_stats (
  journey_id    uuid primary key references journeys(id) on delete cascade,
  view_count    integer not null default 0,
  like_count    integer not null default 0,
  save_count    integer not null default 0,
  comment_count integer not null default 0
);

create or replace function create_journey_stats() returns trigger
language plpgsql as $$
begin
  insert into journey_stats (journey_id) values (new.id)
  on conflict (journey_id) do nothing;
  return new;
end $$;

create trigger journeys_stats_row after insert on journeys
  for each row execute function create_journey_stats();

-- Recompute the cached expense total whenever expenses change.
create or replace function recompute_journey_total() returns trigger
language plpgsql as $$
declare jid uuid;
begin
  jid := coalesce(new.journey_id, old.journey_id);
  update journeys j
     set total_expense_minor = coalesce(
           (select sum(e.amount_minor) from journey_expenses e where e.journey_id = jid), 0)
   where j.id = jid;
  return null;
end $$;

create trigger journey_expenses_total
  after insert or update or delete on journey_expenses
  for each row execute function recompute_journey_total();
