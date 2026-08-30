-- Patch for a database where 0001_init_schema.sql already ran without
-- grants. Run this once in the SQL Editor; do not re-run 0001 (it will
-- fail on `create table`, since the tables already exist).
--
-- Root cause: creating tables via the SQL Editor does not grant table
-- privileges to anon/authenticated/service_role the way the Table Editor
-- UI does. Confirmed empirically: even service_role (which bypasses RLS)
-- got "permission denied for table stands" on both select and insert.

grant select, insert, update, delete on public.stands to service_role;
grant select, insert, update, delete on public.card_texts to service_role;

grant select, insert, update on public.stands to authenticated;
grant select, insert on public.card_texts to authenticated;
