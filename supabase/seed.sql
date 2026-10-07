-- Optional demo seed. It is safe to run repeatedly.
-- Create at least two users through Supabase Auth first. The trigger in the core
-- migration creates matching profile rows; this script then adds a sample vehicle,
-- ride, group, and booking using the first two profiles it finds.

do $$
declare
  v_driver uuid;
  v_passenger uuid;
  v_vehicle uuid;
  v_ride uuid;
  v_group uuid;
begin
  select id into v_driver from public.profiles order by created_at limit 1;
  select id into v_passenger from public.profiles where id <> v_driver order by created_at limit 1;

  if v_driver is null then
    raise notice 'Seed skipped: create a Supabase Auth user first.';
    return;
  end if;

  update public.profiles
  set full_name = case when full_name = '' then 'Demo Driver' else full_name end,
      role = 'both'
  where id = v_driver;

  insert into public.vehicles (
    owner_id, make, model, color, registration_number, seats, vehicle_type
  ) values (
    v_driver, 'Maruti Suzuki', 'Dzire', 'White', 'DEMO-YV-0001', 4, 'sedan'
  )
  on conflict (registration_number) do update set active = true
  returning id into v_vehicle;

  select id into v_ride
  from public.rides
  where driver_id = v_driver and notes = 'YatriVahan demo ride'
  limit 1;

  if v_ride is null then
    insert into public.rides (
      driver_id, vehicle_id, ride_type, status,
      origin_name, origin_lat, origin_lng,
      destination_name, destination_lat, destination_lng,
      departure_time, seats_total, seats_available, price_per_seat, notes
    ) values (
      v_driver, v_vehicle, 'carpool', 'scheduled',
      'Connaught Place, New Delhi', 28.6315, 77.2167,
      'Cyber City, Gurugram', 28.4948, 77.0888,
      now() + interval '1 day', 4, 4, 220, 'YatriVahan demo ride'
    ) returning id into v_ride;
  end if;

  if v_passenger is not null then
    insert into public.bookings (ride_id, passenger_id, seats, amount, status)
    values (v_ride, v_passenger, 1, 220, 'confirmed')
    on conflict (ride_id, passenger_id) do nothing;
  end if;

  select id into v_group
  from public.groups
  where owner_id = v_driver and name = 'Delhi to Gurugram Commuters'
  limit 1;

  if v_group is null then
    insert into public.groups (
      owner_id, name, origin_name, destination_name, travel_date,
      preferred_time, max_members, description
    ) values (
      v_driver, 'Delhi to Gurugram Commuters', 'New Delhi', 'Gurugram',
      current_date + 1, '08:30', 12, 'A demo weekday carpool group.'
    ) returning id into v_group;
  end if;

  if v_passenger is not null then
    insert into public.group_members (group_id, user_id, role, status)
    values (v_group, v_passenger, 'member', 'active')
    on conflict (group_id, user_id) do nothing;
  end if;
end $$;

