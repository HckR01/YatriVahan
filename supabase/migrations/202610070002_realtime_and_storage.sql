-- Realtime tables used by the map, trip state, notifications, and group chat.
alter table public.rides replica identity full;
alter table public.bookings replica identity full;
alter table public.ride_locations replica identity full;
alter table public.group_messages replica identity full;
alter table public.notifications replica identity full;

do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array array['rides', 'bookings', 'ride_locations', 'group_messages', 'notifications']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table_name);
    end if;
  end loop;
end $$;

-- Public images only. Identity documents must never be stored in this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public media is readable"
on storage.objects for select
using (bucket_id = 'public-media');

create policy "Users can upload to their media folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'public-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their media"
on storage.objects for update to authenticated
using (bucket_id = 'public-media' and owner_id = auth.uid()::text)
with check (bucket_id = 'public-media' and owner_id = auth.uid()::text);

create policy "Users can delete their media"
on storage.objects for delete to authenticated
using (bucket_id = 'public-media' and owner_id = auth.uid()::text);

