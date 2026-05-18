import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "stockchat.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      symbol TEXT PRIMARY KEY,
      added_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      parts TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at);
  `);
  return _db;
}

export interface WatchlistRow {
  symbol: string;
  added_at: number;
}

export const watchlistRepo = {
  list(): string[] {
    const rows = db()
      .prepare("SELECT symbol FROM watchlist ORDER BY added_at ASC")
      .all() as WatchlistRow[];
    return rows.map((r) => r.symbol);
  },
  add(symbol: string): void {
    db()
      .prepare(
        "INSERT OR IGNORE INTO watchlist (symbol, added_at) VALUES (?, ?)",
      )
      .run(symbol.toUpperCase(), Date.now());
  },
  remove(symbol: string): void {
    db()
      .prepare("DELETE FROM watchlist WHERE symbol = ?")
      .run(symbol.toUpperCase());
  },
};

export interface ChatRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  parts: string;
  created_at: number;
}

export const chatsRepo = {
  list(): ChatRow[] {
    return db()
      .prepare("SELECT * FROM chats ORDER BY updated_at DESC LIMIT 50")
      .all() as ChatRow[];
  },
  get(id: string): ChatRow | undefined {
    return db().prepare("SELECT * FROM chats WHERE id = ?").get(id) as
      | ChatRow
      | undefined;
  },
  upsert(id: string, title: string): void {
    const now = Date.now();
    db()
      .prepare(
        `INSERT INTO chats (id, title, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at`,
      )
      .run(id, title, now, now);
  },
  delete(id: string): void {
    db().prepare("DELETE FROM chats WHERE id = ?").run(id);
  },
  messages(chatId: string): MessageRow[] {
    return db()
      .prepare(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
      )
      .all(chatId) as MessageRow[];
  },
  saveMessage(
    id: string,
    chatId: string,
    role: string,
    parts: unknown,
  ): void {
    db()
      .prepare(
        `INSERT OR REPLACE INTO messages (id, chat_id, role, parts, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, chatId, role, JSON.stringify(parts), Date.now());
  },
};
