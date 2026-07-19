#!/usr/bin/env tsx
/**
 * Dump the local trader journal SQLite to a JSON snapshot bundled with the
 * dashboard, so the deployed instance (Vercel serverless, no persistent fs)
 * can still show real trader activity as of the last snapshot.
 */
import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.TRADER_DB_PATH ?? `${process.env.HOME}/skyline/data/trader.sqlite`;
const OUT = path.resolve(__dirname, "..", "packages/dashboard/src/data/journal-snapshot.json");

if (!existsSync(DB)) {
  console.error(`No SQLite journal at ${DB}`);
  process.exit(1);
}

mkdirSync(path.dirname(OUT), { recursive: true });

const db = new Database(DB, { readonly: true });
const rows = db
  .prepare(`SELECT * FROM orders ORDER BY timestamp DESC LIMIT 50`)
  .all();

const payload = {
  snapshotAt: Date.now(),
  count: rows.length,
  orders: rows,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`✓ wrote ${rows.length} orders to ${OUT}`);
db.close();
