# Supabase Schema: courts

## Table: courts
Columns:
- id: uuid, primary key, default gen_random_uuid()
- name: text, required
- latitude: double precision, required
- longitude: double precision, required
- address: text, nullable
- court_type: text, nullable (indoor/outdoor)
- surface_type: text, nullable
- number_of_hoops: integer, nullable
- lighting: boolean, nullable
- open_hours: text, nullable
- last_verified_at: timestamptz, nullable
- created_at: timestamptz, default now()
- geom: geography(Point, 4326), nullable (derived from lat/lon)

Indexes:
- Primary key on id
- GiST index on geom for geo queries
- Optional btree index on name for basic search

PostGIS geometry approach:
- Store the canonical point in geom using geography(Point, 4326).
- Keep latitude/longitude for easy client use and debugging.
- Use an RPC function for proximity search (ST_DWithin) later.

RLS policy approach:
- Enable RLS on courts.
- Allow public read access.
- Restrict writes to authenticated users only.

SQL (create extensions, table, indexes, policies):
    create extension if not exists pgcrypto;
    create extension if not exists postgis;

    create table if not exists public.courts (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      latitude double precision not null,
      longitude double precision not null,
      address text,
      court_type text,
      surface_type text,
      number_of_hoops integer,
      lighting boolean,
      open_hours text,
      last_verified_at timestamptz,
      created_at timestamptz not null default now(),
      geom geography(Point, 4326)
    );

    create index if not exists courts_geom_gist on public.courts using gist (geom);
    create index if not exists courts_name_idx on public.courts (name);

    alter table public.courts enable row level security;

    create policy "courts_public_read"
      on public.courts
      for select
      using (true);

    create policy "courts_authenticated_write"
      on public.courts
      for all
      to authenticated
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
