-- ========== FIX STREAK CALCULATION V2 ==========
-- This migration fixes the streak calculation to be simpler and more accurate

-- Drop and recreate the streak update function
drop function if exists update_streak_after_checkin(date);

create or replace function update_streak_after_checkin(checkin_date date)
returns void language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
  s streaks%rowtype;
  consecutive_days int := 1;
  max_streak int := 1;
  checkin_dates date[];
  i int;
  current_date date;
  prev_date date;
  gap_days int;
begin
  -- Get all checkin dates for this user, sorted by date
  select array_agg(date order by date) into checkin_dates
  from checkins
  where user_id = uid;

  if checkin_dates is null or array_length(checkin_dates, 1) = 0 then
    return;
  end if;

  -- Start from the most recent date and work backwards
  current_date := checkin_dates[array_length(checkin_dates, 1)];
  consecutive_days := 1; -- First day always counts as streak 1
  max_streak := 1;

  -- Count consecutive days backwards from the most recent date
  for i in array_length(checkin_dates, 1) - 1 downto 1 loop
    prev_date := checkin_dates[i];
    gap_days := current_date - prev_date;

    -- If previous date is exactly 1 day before current date, continue streak
    if gap_days = 1 then
      consecutive_days := consecutive_days + 1;
      current_date := prev_date;
    else
      -- Gap detected - check if this was the longest streak
      if consecutive_days > max_streak then
        max_streak := consecutive_days;
      end if;

      -- If gap is more than 1 day, streak is broken - start new streak
      if gap_days > 1 then
        consecutive_days := 1;
        current_date := prev_date;
      else
        -- Same day (multiple checkins), continue current streak
        current_date := prev_date;
      end if;
    end if;
  end loop;

  -- Check if the final streak is the longest
  if consecutive_days > max_streak then
    max_streak := consecutive_days;
  end if;

  -- Get or create streak record
  select * into s from streaks where user_id = uid for update;
  if not found then
    insert into streaks(user_id, current, longest, last_date)
    values(uid, consecutive_days, max_streak, checkin_date);
  else
    update streaks
    set current = consecutive_days,
        longest = greatest(longest, max_streak),
        last_date = checkin_date
    where user_id = uid;
  end if;
end $$;

grant execute on function update_streak_after_checkin(date) to authenticated;
