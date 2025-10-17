-- OWNER CHECK helper
create or replace function is_family_owner(fid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from family_members
    where family_id = fid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- CREATE INVITE (default TTL 24h)
create or replace function create_invite(fid uuid, ttl_minutes int default 1440)
returns table(code text, expires_at timestamptz) 
language plpgsql security definer as $$
declare
  v_code text;
  v_exp timestamptz := now() + make_interval(mins => ttl_minutes);
begin
  if not is_family_owner(fid) then
    raise exception 'Not owner';
  end if;

  -- generate 6-digit code
  v_code := lpad((floor(random()*1000000))::int::text, 6, '0');

  insert into invite_codes(code, family_id, ttl, used)
  values (v_code, fid, v_exp, false);

  return query select v_code, v_exp;
end $$;

grant execute on function create_invite(uuid, int) to authenticated;

-- REDEEM INVITE (single-use)
create or replace function redeem_invite(p_code text)
returns uuid language plpgsql security definer as $$
declare
  rec record;
begin
  select code, family_id, ttl, used
  into rec
  from invite_codes
  where code = p_code;

  if not found then
    raise exception 'Invalid code';
  end if;
  if rec.used then
    raise exception 'Code already used';
  end if;
  if now() > rec.ttl then
    raise exception 'Code expired';
  end if;

  -- insert membership (idempotent via unique(family_id,user_id))
  insert into family_members(family_id, user_id, role)
  values (rec.family_id, auth.uid(), 'member')
  on conflict (family_id, user_id) do nothing;

  -- mark used
  update invite_codes set used = true where code = p_code;

  return rec.family_id;
end $$;

grant execute on function redeem_invite(text) to authenticated;


