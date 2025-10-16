export type Role = 'owner' | 'member';
export type Platform = 'ios' | 'android';

export interface Profile {
  user_id: string;
  display_name?: string;
  timezone: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  ayat_count: number;
  created_at: string;
}

export interface Streak {
  user_id: string;
  current: number;
  longest: number;
  last_date?: string; // YYYY-MM-DD
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: Platform;
  created_at: string;
}

export interface InviteCode {
  code: string;
  family_id: string;
  ttl: string; // ISO
  used: boolean;
}


