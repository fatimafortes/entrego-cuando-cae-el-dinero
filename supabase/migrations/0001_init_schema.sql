-- Data model per docs/IMPLEMENTATION_PROMPT.md. RLS is enabled in the same
-- statement that creates each table (non-negotiable constraint #5), and the
-- policies below are the only way in: a supplier reads and writes only rows
-- tied to their own auth.uid(), and card_texts is scoped through the parent
-- stand rather than its own supplier_id column.

create table stands (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id),
  merchant_name text not null check (char_length(merchant_name) between 2 and 80),
  stand_type text not null check (char_length(stand_type) between 2 and 60),
  clabe text not null check (clabe ~ '^[0-9]{18}$'),
  status text not null default 'pending' check (status in ('confirmed', 'pending')),
  created_at timestamptz not null default now()
);

alter table stands enable row level security;

create policy "Suppliers select own stands"
  on stands for select
  using (supplier_id = auth.uid());

create policy "Suppliers insert own stands"
  on stands for insert
  with check (supplier_id = auth.uid());

create policy "Suppliers update own stands"
  on stands for update
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

create table card_texts (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references stands(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table card_texts enable row level security;

create policy "Suppliers select own card_texts"
  on card_texts for select
  using (
    exists (
      select 1 from stands
      where stands.id = card_texts.stand_id
      and stands.supplier_id = auth.uid()
    )
  );

create policy "Suppliers insert own card_texts"
  on card_texts for insert
  with check (
    exists (
      select 1 from stands
      where stands.id = card_texts.stand_id
      and stands.supplier_id = auth.uid()
    )
  );

-- The SQL Editor does not grant table privileges the way the Table Editor
-- UI does. Without these, every role — including service_role, which
-- bypasses RLS — is refused with "permission denied for table", before RLS
-- policies are ever evaluated. Grant exactly the operations each role's
-- policies above allow; nothing is granted to anon (the public rule page in
-- F6 reads through a service-role server route instead, so anon never
-- touches these tables directly).
grant select, insert, update, delete on public.stands to service_role;
grant select, insert, update, delete on public.card_texts to service_role;

grant select, insert, update on public.stands to authenticated;
grant select, insert on public.card_texts to authenticated;
