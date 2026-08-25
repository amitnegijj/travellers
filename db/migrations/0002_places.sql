-- 0002_places.sql — destinations, places, categories
-- Destinations are curated/seeded in Phase 1 (cold-start strategy), not user-created.

create table place_categories (
  id   serial primary key,
  slug text not null unique,
  name text not null,
  icon text not null default 'map-pin'
);

create table destinations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  region      text,
  country     text not null default 'India',
  description text,
  cover_url   text,
  centroid    geography(Point, 4326) not null,
  elevation_m integer,
  best_season text[] not null default '{}',
  created_at  timestamptz not null default now(),
  search_tsv  tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(region, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored
);

create index destinations_centroid_gix on destinations using gist (centroid);
create index destinations_name_trgm    on destinations using gin (name gin_trgm_ops);
create index destinations_tsv          on destinations using gin (search_tsv);

create table places (
  id             uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete set null,
  category_id    integer references place_categories(id) on delete set null,
  slug           text not null unique,
  name           text not null,
  description    text,
  location       geography(Point, 4326) not null,
  address        text,
  price_minor    bigint,
  currency       char(3) not null default 'INR',
  created_at     timestamptz not null default now()
);

create index places_location_gix   on places using gist (location);
create index places_destination_ix on places (destination_id);
create index places_name_trgm      on places using gin (name gin_trgm_ops);
