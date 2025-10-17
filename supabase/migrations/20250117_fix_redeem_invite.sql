-- Fix redeem_invite function

-- Drop and recreate redeem_invite function with correct syntax
DROP FUNCTION IF EXISTS redeem_invite(text);

CREATE OR REPLACE FUNCTION redeem_invite(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  family_id uuid;
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get family_id from invite code
  SELECT ic.family_id INTO family_id
  FROM invite_codes ic
  WHERE ic.code = p_code
  AND ic.used = false
  AND ic.ttl > NOW();
  
  IF family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check if user already in family
  IF EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = family_id 
    AND fm.user_id = user_id
  ) THEN
    RAISE EXCEPTION 'User already in family';
  END IF;

  -- Add user to family
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (family_id, user_id, 'member');
  
  -- Mark invite as used
  UPDATE invite_codes 
  SET used = true 
  WHERE code = p_code;
  
  RETURN family_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION redeem_invite(text) TO authenticated;
