-- Check current RLS policies for families and family_members tables

-- Check families table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('families', 'family_members')
ORDER BY tablename, policyname;

-- Check if RLS is enabled (corrected column names)
SELECT schemaname, tablename, rowsecurity, hasrules
FROM pg_tables 
WHERE tablename IN ('families', 'family_members');
