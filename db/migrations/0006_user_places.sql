-- 0006_user_places.sql — a traveller's personal map.
-- Places someone has been to or discovered, pinned by them, each with its own
-- public/private switch. Distinct from `places` (curated, always public) and
-- from `journey_stops` (belong to one journey).

create type place_visibility as enum ('public', 'private');

create table user_places (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  destination_id uuid references destinations(id) on delete set null,

  name           text not null check (length(btrim(name)) between 1 and 120),
  note           text check (length(note) <= 2000),
  location       geography(Point, 4326) not null,
  photo_url      text,

  -- Per-pin privacy. Private pins are visible ONLY to the owner.
  visibility     place_visibility not null default 'public',

  visited_on     date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index user_places_profile_ix  on user_places (profile_id, created_at desc);
create index user_places_location_gix on user_places using gist (location);
-- The public map is the hot read path.
create index user_places_public_ix on user_places (profile_id)
  where visibility = 'public';

create trigger user_places_touch before update on user_places
  for each row execute function touch_updated_at();
