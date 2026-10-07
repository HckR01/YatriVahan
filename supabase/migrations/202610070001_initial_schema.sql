-- YatriVahan core database schema
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('rider', 'driver', 'both');
create type public.vehicle_type as enum ('bike', 'auto', 'hatchback', 'sedan', 'suv', 'van', 'other');
create type public.ride_type as enum ('carpool', 'private', 'on_demand');
create type public.ride_status as enum (
  'draft', 'scheduled', 'searching', 'accepted', 'arriving',
  'in_progress', 'completed', 'cancelled'
);
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'refunded', 'failed');
create type public.group_role as enum ('admin', 'member');
create type public.membership_status as enum ('pending', 'active', 'declined', 'left');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'rider',
  is_verified boolean not null default false,
  avg_rating numeric(3, 2) not null default 0 check (avg_rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  emergency_contact jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  color text not null,
  registration_number text not null unique,
  seats smallint not null check (seats between 1 and 12),
  vehicle_type public.vehicle_type not null default 'sedan',
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  driver_id uuid references public.profiles(id) on delete set null,
  accepted_driver_id uuid references public.profiles(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  ride_type public.ride_type not null,
  status public.ride_status not null default 'scheduled',
  origin_name text not null,
  origin_lat double precision not null check (origin_lat between -90 and 90),
  origin_lng double precision not null check (origin_lng between -180 and 180),
  destination_name text not null,
  destination_lat double precision not null check (destination_lat between -90 and 90),
  destination_lng double precision not null check (destination_lng between -180 and 180),
  departure_time timestamptz,
  seats_total smallint not null default 1 check (seats_total between 1 and 12),
  seats_available smallint not null default 1 check (seats_available between 0 and 12),
  price_per_seat numeric(10, 2) not null default 0 check (price_per_seat >= 0),
  estimated_fare numeric(10, 2) check (estimated_fare is null or estimated_fare >= 0),
  distance_km numeric(8, 2) check (distance_km is null or distance_km >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  notes text,
  women_only boolean not null default false,
  allow_luggage boolean not null default true,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rides_seat_bounds check (seats_available <= seats_total),
  constraint rides_actor_required check (
    requester_id is not null or driver_id is not null or accepted_driver_id is not null
  ),
  constraint offered_ride_has_driver check (ride_type <> 'carpool' or driver_id is not null)
);

create table public.ride_stops (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  stop_order smallint not null check (stop_order >= 0),
  name text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  eta timestamptz,
  created_at timestamptz not null default now(),
  unique (ride_id, stop_order)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  seats smallint not null default 1 check (seats between 1 and 8),
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  status public.booking_status not null default 'pending',
  pickup_name text,
  pickup_lat double precision check (pickup_lat is null or pickup_lat between -90 and 90),
  pickup_lng double precision check (pickup_lng is null or pickup_lng between -180 and 180),
  dropoff_name text,
  dropoff_lat double precision check (dropoff_lat is null or dropoff_lat between -90 and 90),
  dropoff_lng double precision check (dropoff_lng is null or dropoff_lng between -180 and 180),
  payment_status public.payment_status not null default 'unpaid',
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ride_id, passenger_id)
);

create table public.ride_locations (
  id bigint generated always as identity primary key,
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  heading numeric(6, 2) check (heading is null or heading between 0 and 360),
  speed numeric(8, 2) check (speed is null or speed >= 0),
  accuracy numeric(8, 2) check (accuracy is null or accuracy >= 0),
  recorded_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  origin_name text,
  destination_name text,
  travel_date date,
  preferred_time time,
  max_members smallint not null default 8 check (max_members between 2 and 100),
  description text,
  is_private boolean not null default false,
  join_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.group_role not null default 'member',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.group_messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  constraint rating_not_self check (reviewer_id <> reviewee_id),
  unique (ride_id, reviewer_id, reviewee_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index rides_discovery_idx on public.rides (status, ride_type, departure_time);
create index rides_driver_idx on public.rides (driver_id, created_at desc);
create index rides_requester_idx on public.rides (requester_id, created_at desc);
create index rides_origin_destination_idx on public.rides (origin_name, destination_name);
create index bookings_passenger_idx on public.bookings (passenger_id, created_at desc);
create index bookings_ride_status_idx on public.bookings (ride_id, status);
create index ride_locations_latest_idx on public.ride_locations (ride_id, recorded_at desc);
create index group_members_user_idx on public.group_members (user_id, status);
create index group_messages_group_idx on public.group_messages (group_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger vehicles_set_updated_at before update on public.vehicles
for each row execute function public.set_updated_at();
create trigger rides_set_updated_at before update on public.rides
for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when new.raw_user_meta_data ->> 'role' in ('rider', 'driver', 'both')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'rider'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles when this migration is applied to a project that already has users.
insert into public.profiles (id, full_name, phone, avatar_url, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  u.raw_user_meta_data ->> 'phone',
  u.raw_user_meta_data ->> 'avatar_url',
  case
    when u.raw_user_meta_data ->> 'role' in ('rider', 'driver', 'both')
      then (u.raw_user_meta_data ->> 'role')::public.user_role
    else 'rider'::public.user_role
  end
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_ride_participant(p_ride_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    coalesce(auth.role(), '') = 'service_role' or p_user_id = auth.uid()
  ) and (
    exists (
      select 1
      from public.rides r
      where r.id = p_ride_id
        and p_user_id is not null
        and p_user_id in (r.requester_id, r.driver_id, r.accepted_driver_id)
    ) or exists (
      select 1
      from public.bookings b
      where b.ride_id = p_ride_id
        and b.passenger_id = p_user_id
        and b.status in ('confirmed', 'completed')
    )
  );
$$;

create or replace function public.is_ride_manager(p_ride_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    coalesce(auth.role(), '') = 'service_role' or p_user_id = auth.uid()
  ) and exists (
    select 1
    from public.rides r
    where r.id = p_ride_id
      and p_user_id is not null
      and p_user_id in (r.driver_id, r.accepted_driver_id)
  );
$$;

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    coalesce(auth.role(), '') = 'service_role' or p_user_id = auth.uid()
  ) and exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.status = 'active'
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    coalesce(auth.role(), '') = 'service_role' or p_user_id = auth.uid()
  ) and (
    exists (
      select 1 from public.groups g
      where g.id = p_group_id and g.owner_id = p_user_id
    ) or exists (
      select 1 from public.group_members gm
      where gm.group_id = p_group_id
        and gm.user_id = p_user_id
        and gm.role = 'admin'
        and gm.status = 'active'
    )
  );
$$;

create or replace function public.validate_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_reserved integer;
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  select seats_total into v_total
  from public.rides
  where id = new.ride_id
  for update;

  select coalesce(sum(seats), 0) into v_reserved
  from public.bookings
  where ride_id = new.ride_id
    and status in ('pending', 'confirmed')
    and id <> new.id;

  if v_reserved + new.seats > v_total then
    raise exception 'Not enough seats available' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create or replace function public.sync_ride_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_ride_id uuid;
  v_old_ride_id uuid;
begin
  if tg_op <> 'DELETE' then
    v_new_ride_id := new.ride_id;
  end if;
  if tg_op <> 'INSERT' then
    v_old_ride_id := old.ride_id;
  end if;

  update public.rides r
  set seats_available = greatest(
    0,
    r.seats_total - coalesce((
      select sum(b.seats)
      from public.bookings b
      where b.ride_id = r.id
        and b.status in ('pending', 'confirmed')
    ), 0)
  )
  where r.id = v_new_ride_id or r.id = v_old_ride_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger bookings_validate_capacity
before insert or update of ride_id, seats, status on public.bookings
for each row execute function public.validate_booking_capacity();

create trigger bookings_sync_seats
after insert or update of ride_id, seats, status or delete on public.bookings
for each row execute function public.sync_ride_seats();

create or replace function public.update_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_user_id uuid;
  v_old_user_id uuid;
begin
  if tg_op <> 'DELETE' then
    v_new_user_id := new.reviewee_id;
  end if;
  if tg_op <> 'INSERT' then
    v_old_user_id := old.reviewee_id;
  end if;

  update public.profiles p
  set avg_rating = coalesce((select round(avg(score)::numeric, 2) from public.ratings where reviewee_id = p.id), 0),
      rating_count = (select count(*) from public.ratings where reviewee_id = p.id)
  where p.id = v_new_user_id or p.id = v_old_user_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger ratings_update_profile
after insert or update of score or delete on public.ratings
for each row execute function public.update_profile_rating();

-- Add each group owner as its first admin.
create or replace function public.add_group_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role, status)
  values (new.id, new.owner_id, 'admin', 'active')
  on conflict (group_id, user_id) do update set role = 'admin', status = 'active';
  return new;
end;
$$;

create trigger groups_add_owner
after insert on public.groups
for each row execute function public.add_group_owner();

create or replace function public.validate_group_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_members integer;
  v_active_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select max_members into v_max_members
  from public.groups
  where id = new.group_id
  for update;

  select count(*) into v_active_count
  from public.group_members gm
  where gm.group_id = new.group_id
    and gm.status = 'active'
    and (gm.group_id, gm.user_id) <> (new.group_id, new.user_id);

  if v_active_count >= v_max_members then
    raise exception 'Group is full' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger group_members_validate_capacity
before insert or update of group_id, status on public.group_members
for each row execute function public.validate_group_capacity();

-- Capacity-safe group join. Authenticated callers may only join themselves. The
-- service role can activate an invited member after the backend validates a private
-- group's join code. Locking the group row prevents concurrent joins over capacity.
create or replace function public.join_group(p_group_id uuid, p_user_id uuid)
returns public.group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups%rowtype;
  v_member public.group_members%rowtype;
  v_active_count integer;
begin
  if p_user_id is null then
    raise exception 'A user is required' using errcode = 'not_null_violation';
  end if;

  if coalesce(auth.role(), '') <> 'service_role' and p_user_id <> auth.uid() then
    raise exception 'You can only join a group as yourself' using errcode = 'insufficient_privilege';
  end if;

  select * into v_group
  from public.groups
  where id = p_group_id
  for update;

  if not found then
    raise exception 'Group not found' using errcode = 'no_data_found';
  end if;

  select * into v_member
  from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  if v_member.status = 'active' then
    return v_member;
  end if;

  if v_group.is_private
     and coalesce(auth.role(), '') <> 'service_role'
     and coalesce(v_member.status::text, '') <> 'pending' then
    raise exception 'This private group requires an invitation or join code'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_active_count
  from public.group_members
  where group_id = p_group_id and status = 'active';

  if v_active_count >= v_group.max_members then
    raise exception 'Group is full' using errcode = 'check_violation';
  end if;

  insert into public.group_members (group_id, user_id, role, status, joined_at)
  values (p_group_id, p_user_id, 'member', 'active', now())
  on conflict (group_id, user_id) do update
    set status = 'active',
        joined_at = now(),
        role = case
          when public.group_members.role = 'admin' then 'admin'::public.group_role
          else 'member'::public.group_role
        end
  returning * into v_member;

  return v_member;
end;
$$;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_stops enable row level security;
alter table public.bookings enable row level security;
alter table public.ride_locations enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;

-- Application-table writes are intentionally API-only. Authenticated clients get
-- read access for RLS-filtered Realtime subscriptions plus a narrow profile update
-- grant below. The backend authenticates every request, performs actor/transition
-- checks, and writes with the service role. This prevents clients from self-booking,
-- self-confirming payments, claiming drivers, or publishing spoofed map locations.

create policy "Authenticated users can view profiles"
on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can view active vehicles"
on public.vehicles for select to authenticated using (active or owner_id = auth.uid());

create policy "Users can discover or view their rides"
on public.rides for select to authenticated
using (
  (status in ('scheduled', 'searching') and (departure_time is null or departure_time > now() - interval '2 hours'))
  or public.is_ride_participant(id)
);

create policy "Visible ride stops can be read"
on public.ride_stops for select to authenticated
using (exists (select 1 from public.rides r where r.id = ride_id));

create policy "Passengers and ride owners can view bookings"
on public.bookings for select to authenticated
using (passenger_id = auth.uid() or public.is_ride_manager(ride_id));

create policy "Participants can view live locations"
on public.ride_locations for select to authenticated using (public.is_ride_participant(ride_id));

create policy "Public groups and members' groups are visible"
on public.groups for select to authenticated
using (not is_private or public.is_group_member(id));

create policy "Group members are visible to their group"
on public.group_members for select to authenticated
using (user_id = auth.uid() or public.is_group_member(group_id));

create policy "Members can read group messages"
on public.group_messages for select to authenticated using (public.is_group_member(group_id));

create policy "Participants can view ride ratings"
on public.ratings for select to authenticated using (public.is_ride_participant(ride_id));

create policy "Users can view their notifications"
on public.notifications for select to authenticated using (user_id = auth.uid());

revoke all on function public.is_ride_participant(uuid, uuid) from public, anon;
revoke all on function public.is_ride_manager(uuid, uuid) from public, anon;
revoke all on function public.is_group_member(uuid, uuid) from public, anon;
revoke all on function public.is_group_admin(uuid, uuid) from public, anon;
revoke all on function public.join_group(uuid, uuid) from public, anon;
grant execute on function public.is_ride_participant(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_ride_manager(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_group_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_group_admin(uuid, uuid) to service_role;
grant execute on function public.join_group(uuid, uuid) to authenticated, service_role;

grant usage on schema public to authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Keep contact and safety data server-only. Authenticated clients can discover the
-- public profile card fields, while profile/contact reads go through the API.
revoke select on public.profiles from authenticated;
grant select (
  id, full_name, avatar_url, bio, role, is_verified,
  avg_rating, rating_count, created_at, updated_at
) on public.profiles to authenticated;
grant update (
  full_name, phone, avatar_url, bio, emergency_contact
) on public.profiles to authenticated;

