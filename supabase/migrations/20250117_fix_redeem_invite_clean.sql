-- Fix redeem_invite function with clean syntax

DROP FUNCTION IF EXISTS redeem_invite(text);

CREATE OR REPLACE FUNCTION redeem_invite(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get family_id from invite code
  SELECT ic.family_id INTO v_family_id
  FROM invite_codes ic
  WHERE ic.code = p_code
  AND ic.used = false
  AND ic.ttl > NOW();
  
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check if user already in family
  IF EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = v_family_id 
    AND fm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User already in family';
  END IF;

  -- Add user to family
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (v_family_id, v_user_id, 'member');
  
  -- Mark invite as used
  UPDATE invite_codes 
  SET used = true 
  WHERE code = p_code;
  
  RETURN v_family_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION redeem_invite(text) TO authenticated;
