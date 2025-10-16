import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('miqra.db');

export function initLocal() {
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
  const stmt = db.prepareSync('insert into pending_checkins (payload_json, created_at) values (?, ?)');
  stmt.executeSync(JSON.stringify(payload), Date.now());
}

export function popPending(limit = 10) {
  const rows = db.getAllSync('select id, payload_json from pending_checkins order by id asc limit ?', [limit]);
  return rows as { id: number; payload_json: string }[];
}

export function deletePending(id: number) {
  db.runSync('delete from pending_checkins where id = ?', [id]);
}

export function cacheCheckin(userId: string, date: string, ayatCount: number) {
  db.runSync('insert or replace into recent_checkins (user_id, date, ayat_count) values (?, ?, ?)', [userId, date, ayatCount]);
}

export function getRecentCheckins(userId: string, days = 30) {
  const rows = db.getAllSync('select * from recent_checkins where user_id = ? order by date desc limit ?', [userId, days]);
  return rows as { user_id: string; date: string; ayat_count: number }[];
}


