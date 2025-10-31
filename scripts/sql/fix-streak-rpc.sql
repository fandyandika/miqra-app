-- Fix the update_streak_after_checkin RPC to accept user_id parameter
create or replace function update_streak_after_checkin(checkin_user_id uuid, checkin_date date)
returns void language plpgsql security definer as $$
declare
  s streaks%rowtype;
begin
  select * into s from streaks where user_id = checkin_user_id for update;
  if not found then
    insert into streaks(user_id, current, longest, last_date)
    values(checkin_user_id, 1, 1, checkin_date)
    on conflict (user_id) do nothing;
    return;
  end if;

  if s.last_date = checkin_date then
    return;
  elsif s.last_date = checkin_date - interval '1 day' then
    s.current := s.current + 1;
  else
    s.current := 1;
  end if;

  if s.current > s.longest then s.longest := s.current; end if;
  s.last_date := checkin_date;

  update streaks set current = s.current, longest = s.longest, last_date = s.last_date where user_id = checkin_user_id;
end $$;

grant execute on function update_streak_after_checkin(uuid, date) to authenticated;
