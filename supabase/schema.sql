-- =============================================================
-- Vanworks Admin Panel — Supabase schema
-- Run this in the Supabase SQL editor.
-- =============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  photo_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- van_models ----------
create table if not exists public.van_models (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Untitled Model',
  image_url text,
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- sales_specs ----------
create table if not exists public.sales_specs (
  id uuid primary key default gen_random_uuid(),
  van_model_id uuid not null references public.van_models(id) on delete cascade,
  section text not null,
  name text not null,
  price numeric(12,2) not null default 0,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_sales_specs_van_model on public.sales_specs(van_model_id);

-- ---------- build_specs ----------
create table if not exists public.build_specs (
  id uuid primary key default gen_random_uuid(),
  van_model_id uuid not null references public.van_models(id) on delete cascade,
  section text not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_build_specs_van_model on public.build_specs(van_model_id);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  van_model_id uuid not null references public.van_models(id) on delete cascade,
  customer_name text not null default 'Unnamed',
  order_date date not null default current_date,
  fabric_color text,
  floor_color text,
  main_price numeric(12,2) not null default 0,
  addons_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  sales_notes text,
  build_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_van_model on public.orders(van_model_id);

-- ---------- order_sales_selections ----------
create table if not exists public.order_sales_selections (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sales_spec_id uuid not null references public.sales_specs(id) on delete cascade,
  selected boolean not null default true,
  unique (order_id, sales_spec_id)
);
create index if not exists idx_oss_order on public.order_sales_selections(order_id);

-- ---------- order_build_extras ----------
create table if not exists public.order_build_extras (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index if not exists idx_obe_order on public.order_build_extras(order_id);

-- ---------- order_sales_extras ----------
-- Custom (off-catalog) add-ons that an order has, on top of the configured
-- sales_specs add-ons selected via order_sales_selections.
create table if not exists public.order_sales_extras (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  section text not null check (section in ('CABIN_ADDONS', 'MISC_ADDONS', 'EXTERIOR_ADDONS')),
  name text not null default '',
  price numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_ose_order on public.order_sales_extras(order_id);

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.profiles enable row level security;
alter table public.van_models enable row level security;
alter table public.sales_specs enable row level security;
alter table public.build_specs enable row level security;
alter table public.orders enable row level security;
alter table public.order_sales_selections enable row level security;
alter table public.order_build_extras enable row level security;
alter table public.order_sales_extras enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select approved from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---- profiles policies ----
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_self_update_name_photo" on public.profiles;
create policy "profiles_self_update_name_photo" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- van_models policies ----
drop policy if exists "vm_select_authed" on public.van_models;
create policy "vm_select_authed" on public.van_models
  for select using (auth.role() = 'authenticated');

drop policy if exists "vm_admin_write" on public.van_models;
create policy "vm_admin_write" on public.van_models
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "vm_approved_write" on public.van_models;
create policy "vm_approved_write" on public.van_models
  for all using (public.is_approved()) with check (public.is_approved());

-- ---- sales_specs / build_specs policies ----
drop policy if exists "specs_select" on public.sales_specs;
create policy "specs_select" on public.sales_specs
  for select using (auth.role() = 'authenticated');

drop policy if exists "specs_write" on public.sales_specs;
create policy "specs_write" on public.sales_specs
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "bspecs_select" on public.build_specs;
create policy "bspecs_select" on public.build_specs
  for select using (auth.role() = 'authenticated');

drop policy if exists "bspecs_write" on public.build_specs;
create policy "bspecs_write" on public.build_specs
  for all using (public.is_approved()) with check (public.is_approved());

-- ---- orders policies ----
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (auth.role() = 'authenticated');

drop policy if exists "orders_write" on public.orders;
create policy "orders_write" on public.orders
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "oss_select" on public.order_sales_selections;
create policy "oss_select" on public.order_sales_selections
  for select using (auth.role() = 'authenticated');

drop policy if exists "oss_write" on public.order_sales_selections;
create policy "oss_write" on public.order_sales_selections
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "obe_select" on public.order_build_extras;
create policy "obe_select" on public.order_build_extras
  for select using (auth.role() = 'authenticated');

drop policy if exists "obe_write" on public.order_build_extras;
create policy "obe_write" on public.order_build_extras
  for all using (public.is_approved()) with check (public.is_approved());

drop policy if exists "ose_select" on public.order_sales_extras;
create policy "ose_select" on public.order_sales_extras
  for select using (auth.role() = 'authenticated');

drop policy if exists "ose_write" on public.order_sales_extras;
create policy "ose_write" on public.order_sales_extras
  for all using (public.is_approved()) with check (public.is_approved());

-- =============================================================
-- Storage bucket for images
-- =============================================================
insert into storage.buckets (id, name, public)
values ('vanworks', 'vanworks', true)
on conflict (id) do nothing;

drop policy if exists "vanworks_public_read" on storage.objects;
create policy "vanworks_public_read" on storage.objects
  for select using (bucket_id = 'vanworks');

drop policy if exists "vanworks_authed_write" on storage.objects;
create policy "vanworks_authed_write" on storage.objects
  for insert with check (
    bucket_id = 'vanworks' and auth.role() = 'authenticated'
  );

drop policy if exists "vanworks_authed_update" on storage.objects;
create policy "vanworks_authed_update" on storage.objects
  for update using (bucket_id = 'vanworks' and auth.role() = 'authenticated');

drop policy if exists "vanworks_authed_delete" on storage.objects;
create policy "vanworks_authed_delete" on storage.objects
  for delete using (bucket_id = 'vanworks' and auth.role() = 'authenticated');
