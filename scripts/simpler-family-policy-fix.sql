-- Simpler fix for family_members policy
-- Just allow all authenticated users to see family members
-- This avoids any recursion issues

-- Drop all existing policies
drop policy if exists "select family members in my families" on family_members;
drop policy if exists "family owners can see all members" on family_members;

-- Create simple policy for authenticated users
create policy "authenticated users can see family members" on family_members
for select using (auth.uid() is not null);

-- Keep the insert policy as is (users can only insert themselves)
-- This is already correct: auth.uid() = user_id
