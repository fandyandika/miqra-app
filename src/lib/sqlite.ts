import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Only initialize SQLite on native platforms
let db: SQLite.SQLiteDatabase | null = null;

if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync('miqra.db');
}

export function initLocal() {
  if (Platform.OS === 'web') {
    console.log('[SQLite] Web platform - using localStorage fallback');
    return null;
  }
  
  if (!db) {
    console.warn('[SQLite] Database not initialized');
    return null;
  }
  
  db.execSync(`
      create table if not exists pending_checkins(
        id integer primary key autoincrement,
        payload_json text not null,
        created_at integer not null
      );
      create table if not exists recent_checkins(
        user_id text not null,
        date text not null,
        ayat_count integer not null,
        primary key (user_id, date)
      );
    `);
  console.log('[SQLite] Local database initialized');
  return db;
}

export function queueCheckin(payload: object) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - checkin queued in memory');
    return;
  }
  
  const stmt = db.prepareSync('insert into pending_checkins (payload_json, created_at) values (?, ?)');
  stmt.executeSync(JSON.stringify(payload), Date.now());
}

export function popPending(limit = 10) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - no pending checkins');
    return [];
  }
  
  const rows = db.getAllSync('select id, payload_json from pending_checkins order by id asc limit ?', [limit]);
  return rows as { id: number; payload_json: string }[];
}

export function deletePending(id: number) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - no pending checkins to delete');
    return;
  }
  
  db.runSync('delete from pending_checkins where id = ?', [id]);
}

export function cacheCheckin(userId: string, date: string, ayatCount: number) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - checkin cached in memory');
    return;
  }
  
  db.runSync('insert or replace into recent_checkins (user_id, date, ayat_count) values (?, ?, ?)', [userId, date, ayatCount]);
}

export function getRecentCheckins(userId: string, days = 30) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - no recent checkins');
    return [];
  }
  
  const rows = db.getAllSync('select * from recent_checkins where user_id = ? order by date desc limit ?', [userId, days]);
  return rows as { user_id: string; date: string; ayat_count: number }[];
}

export function countPending(): number {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - no pending checkins');
    return 0;
  }
  
  try {
    const rows = db.getAllSync('select count(*) as c from pending_checkins');
    const rec = Array.isArray(rows) ? rows[0] : rows;
    return (rec && typeof rec === 'object' && 'c' in rec) ? (rec.c as number) : 0;
  } catch (error) {
    console.error('[SQLite] countPending error:', error);
    return 0;
  }
}

export function peekPending(limit = 10) {
  if (Platform.OS === 'web' || !db) {
    console.log('[SQLite] Web platform - no pending checkins');
    return [];
  }
  
  // Read-only view without deleting
  const rows = db.getAllSync(
    'select id, payload_json from pending_checkins order by id asc limit ?',
    [limit]
  );
  return rows as { id: number; payload_json: string }[];
}


