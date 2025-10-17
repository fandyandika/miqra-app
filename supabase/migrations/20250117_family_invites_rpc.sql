-- RPC functions for family invites

-- Check if user is family owner
CREATE OR REPLACE FUNCTION is_family_owner(family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = is_family_owner.family_id 
    AND family_members.user_id = auth.uid() 
    AND family_members.role = 'owner'
  );
END;
$$;

-- Create invite code
CREATE OR REPLACE FUNCTION create_invite(fid uuid, ttl_minutes int DEFAULT 1440)
RETURNS TABLE(code text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_code text;
  expires_time timestamptz;
BEGIN
  -- Check if user is family owner
  IF NOT is_family_owner(fid) THEN
    RAISE EXCEPTION 'Only family owners can create invites';
  END IF;

  -- Generate 6-digit code
  invite_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Set expiration time
  expires_time := NOW() + (ttl_minutes || ' minutes')::interval;
  
  -- Insert invite code
  INSERT INTO invite_codes (code, family_id, ttl, used)
  VALUES (invite_code, fid, expires_time, false);
  
  RETURN QUERY SELECT invite_code, expires_time;
END;
$$;

-- Redeem invite code
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
  SELECT invite_codes.family_id INTO family_id
  FROM invite_codes
  WHERE invite_codes.code = p_code
  AND invite_codes.used = false
  AND invite_codes.ttl > NOW();
  
  IF family_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check if user already in family
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_members.family_id = redeem_invite.family_id 
    AND family_members.user_id = user_id
  ) THEN
    RAISE EXCEPTION 'User already in family';
  END IF;

  -- Add user to family
  INSERT INTO family_members (family_id, user_id, role)
  VALUES (family_id, user_id, 'member');
  
  -- Mark invite as used
  UPDATE invite_codes 
  SET used = true 
  WHERE invite_codes.code = p_code;
  
  RETURN family_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_family_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_invite(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_invite(text) TO authenticated;
