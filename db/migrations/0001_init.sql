-- 0001_init.sql — extensions, identity, profiles
-- Forward-only. Never edit an applied migration.

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------- identity

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  password_hash text   not null,
  created_at    timestamptz not null default now()
);

create table profiles (
  id           uuid primary key references users(id) on delete cascade,
  handle       citext not null unique,
  display_name text   not null,
  bio          text,
  avatar_url   text,
  location     text,
  is_private   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

create index profiles_handle_trgm on profiles using gin (handle gin_trgm_ops);
create index profiles_name_trgm   on profiles using gin (display_name gin_trgm_ops);

-- updated_at maintenance, reused by later migrations
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
