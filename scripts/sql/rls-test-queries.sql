-- RLS Security Tests - Run these in Supabase Dashboard > SQL Editor
-- IMPORTANT: You need to authenticate as USER_B for these tests to work properly

-- First, get the user IDs and family ID
-- Replace these with actual values from your database:
-- USER_A: f5d3868a-07a8-4f64-8543-3d4b90d910c9
-- USER_B: 67aeb58d-f670-4254-9642-765d91c9d103
-- FAMILY_ID: ca649897-4c39-44b8-961c-01399e0820d7

-- ========================================
-- TEST 1: USER_B cannot select families they don't belong to
-- Expected: 0 rows (if USER_B is not a member)
-- ========================================
select 'Test 1: USER_B cannot select families they don\'t belong to' as test_name;
select count(*) as rows_returned, 'Expected: 0 rows' as expected
from families 
where id = 'ca649897-4c39-44b8-961c-01399e0820d7';

-- ========================================
-- TEST 2: USER_B cannot see USER_A checkins
-- Expected: 0 rows (USER_B cannot see USER_A data)
-- ========================================
select 'Test 2: USER_B cannot see USER_A checkins' as test_name;
select count(*) as rows_returned, 'Expected: 0 rows' as expected
from checkins 
where user_id = 'f5d3868a-07a8-4f64-8543-3d4b90d910c9' 
and date = current_date;

-- ========================================
-- TEST 3: USER_B can select own checkins
-- Expected: 0 rows (USER_B has no checkins yet)
-- ========================================
select 'Test 3: USER_B can select own checkins' as test_name;
select count(*) as rows_returned, 'Expected: 0 rows initially' as expected
from checkins 
where user_id = '67aeb58d-f670-4254-9642-765d91c9d103';

-- ========================================
-- TEST 4: USER_B cannot update USER_A streak
-- Expected: Permission error or 0 rows updated
-- ========================================
select 'Test 4: USER_B cannot update USER_A streak' as test_name;
-- This should fail with permission error
update streaks 
set current = 999 
where user_id = 'f5d3868a-07a8-4f64-8543-3d4b90d910c9';

-- ========================================
-- TEST 5: USER_B can insert their own checkin
-- Expected: 1 row inserted (user_id auto via trigger)
-- ========================================
select 'Test 5: USER_B can insert their own checkin' as test_name;
insert into checkins (date, ayat_count) 
values (current_date, 3);

-- Check if it was inserted
select count(*) as rows_inserted, 'Expected: 1 row' as expected
from checkins 
where user_id = '67aeb58d-f670-4254-9642-765d91c9d103'
and date = current_date;

-- ========================================
-- TEST 6: USER_B can update own streak
-- Expected: Success
-- ========================================
select 'Test 6: USER_B can update own streak' as test_name;
select update_streak_after_checkin('67aeb58d-f670-4254-9642-765d91c9d103', current_date);

-- Check streak was updated
select current, longest, last_date, 'Expected: current=1, longest=1' as expected
from streaks 
where user_id = '67aeb58d-f670-4254-9642-765d91c9d103';
