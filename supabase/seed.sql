-- Seed: 10 kartu kosong untuk pengujian
insert into public.cards (id) values
  ('CARD-001'),
  ('CARD-002'),
  ('CARD-003'),
  ('CARD-004'),
  ('CARD-005'),
  ('CARD-006'),
  ('CARD-007'),
  ('CARD-008'),
  ('CARD-009'),
  ('CARD-010')
on conflict (id) do nothing;
