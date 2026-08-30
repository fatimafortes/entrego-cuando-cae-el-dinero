-- F4 requires a stand's card to be generated exactly once and be
-- byte-identical on every reprint. Without a uniqueness guarantee, a race
-- (a double-click, two tabs, a retried request) could insert two
-- card_texts rows for the same stand, and a later `select ... single()`
-- would non-deterministically pick one — silently breaking that guarantee.
--
-- This constraint lets the app use `insert ... on conflict (stand_id) do
-- nothing`, so whichever request wins the race is the one every future
-- view reads back. There is deliberately no update policy on card_texts
-- (see 0001), so "do nothing" is correct: the loser must never overwrite
-- the winner's text.

alter table card_texts
  add constraint card_texts_stand_id_key unique (stand_id);
