-- ========== CORRECT STREAK CALCULATION ==========
-- This migration creates the correct streak calculation logic
-- Streak logic: 1,2,3,4... -> gap -> 0 -> 1,2,3,4...

-- Drop and recreate the streak update function
drop function if exists update_streak_after_checkin(date);

create or replace function update_streak_after_checkin(checkin_date date)
returns void language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
  checkin_dates date[];
  consecutive_days int := 1;
  max_streak int := 1;
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

  -- Start from the most recent date
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

  -- Upsert streak record
  insert into streaks(user_id, current, longest, last_date)
  values(uid, consecutive_days, max_streak, checkin_date)
  on conflict (user_id) do update set
    current = consecutive_days,
    longest = greatest(streaks.longest, max_streak),
    last_date = checkin_date;
end $$;

grant execute on function update_streak_after_checkin(date) to authenticated;
