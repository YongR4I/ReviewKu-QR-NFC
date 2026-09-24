-- Perbaikan tipe hasil p_card_scan:
-- business_name bertipe varchar(150), harus sama persis di RETURNS TABLE
-- (CREATE OR REPLACE tidak boleh mengubah return type → drop dulu).

drop function if exists public.p_card_scan(varchar);

create function public.p_card_scan(p_card_id varchar)
returns table (
  card_is_active     boolean,
  card_review_url    text,
  card_business_name varchar(150)
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.cards
     set scan_count = scan_count + case when is_active then 1 else 0 end
   where id = p_card_id
  returning cards.is_active, cards.review_url, cards.business_name;
end;
$$;

revoke execute on function public.p_card_scan(varchar) from public, anon, authenticated;
grant execute on function public.p_card_scan(varchar) to service_role;
