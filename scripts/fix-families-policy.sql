-- Fix families table policy to avoid recursion
-- The current policy references family_members which can cause issues

-- Drop existing policies
drop policy if exists "select families for members" on families;
drop policy if exists "insert family" on families;

-- Create simpler policies
-- Allow users to see families they created
create policy "users can see own families" on families
for select using (auth.uid() = created_by);

-- Allow users to insert families they create
create policy "users can create families" on families
for insert with check (auth.uid() = created_by);

-- Allow users to see families where they are members (simplified)
create policy "users can see families they belong to" on families
for select using (
  id in (
    select family_id 
    from family_members 
    where user_id = auth.uid()
  )
);
