create table if not exists users (
  id serial primary key,
  chat_id bigint not null unique,
  locale text default 'uk',
  created_at timestamptz default now()
);

create table if not exists addresses (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  region text,
  city text not null,
  street text not null,
  house text not null,
  queue text not null,
  subgroup text,
  source_url text,
  updated_at timestamptz default now()
);

create table if not exists subs (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  address_id integer not null references addresses(id) on delete cascade,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists daily_mode (
  id serial primary key,
  region text not null,
  date date not null,
  version integer not null,
  queue text not null,
  intervals jsonb not null,
  fetched_at timestamptz default now(),
  source_url text
);

create table if not exists jobs (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  address_id integer not null references addresses(id) on delete cascade,
  queue text not null,
  date date not null,
  kind text not null check (kind in ('off','on')),
  run_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','sent','canceled'))
);
