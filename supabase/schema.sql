-- WAER Asset Generator – Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Scents table
create table if not exists scents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  primary_colour text not null,
  secondary_colour text not null,
  hero_ingredients text[] not null default '{}',
  mood text not null default '',
  background_palette text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Assets table
create table if not exists assets (
  id uuid primary key default uuid_generate_v4(),
  scent_id uuid not null references scents(id) on delete cascade,
  product_state text not null,
  prompt text not null,
  image_url text not null,
  aspect_ratio text not null default '1:1',
  generation_mode text not null default 'text',
  is_favourite boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists assets_scent_id_idx on assets(scent_id);
create index if not exists assets_created_at_idx on assets(created_at desc);

-- Storage buckets (run via Supabase dashboard or CLI)
-- insert into storage.buckets (id, name, public) values ('generated-assets', 'generated-assets', true);
-- insert into storage.buckets (id, name, public) values ('reference-images', 'reference-images', true);

-- RLS Policies (adjust for your auth setup)
alter table scents enable row level security;
alter table assets enable row level security;

-- Allow all for now (tighten per your auth requirements)
create policy "Allow all on scents" on scents for all using (true) with check (true);
create policy "Allow all on assets" on assets for all using (true) with check (true);
