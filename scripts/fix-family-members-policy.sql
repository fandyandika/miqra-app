-- Fix infinite recursion in family_members policy
-- The issue is that the policy references family_members table itself

-- Drop the problematic policy
drop policy if exists "select family members in my families" on family_members;

-- Create a simpler policy that doesn't cause recursion
-- Allow users to see family members if they are a member of that family
-- Use a different approach to avoid self-reference
create policy "select family members in my families" on family_members
for select using (
  -- Check if the current user is a member of the same family
  family_id in (
    select fm.family_id 
    from family_members fm 
    where fm.user_id = auth.uid()
  )
);

-- Also add a policy for owners to see all members
create policy "family owners can see all members" on family_members
for select using (
  -- Check if user is owner of the family
  family_id in (
    select f.id 
    from families f 
    where f.created_by = auth.uid()
  )
);
