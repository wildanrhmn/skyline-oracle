import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { OrderReceipt } from "./executor.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  market_id TEXT NOT NULL,
  market_title TEXT NOT NULL,
  is_yes INTEGER NOT NULL,
  is_buy INTEGER NOT NULL,
  stake_usd REAL NOT NULL,
  expected_price REAL NOT NULL,
  fair_probability REAL NOT NULL,
  edge_pct REAL NOT NULL,
  order_ref TEXT NOT NULL,
  tx_signature TEXT,
  reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_ts ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_market ON orders(market_id);
`;

export class Journal {
  private readonly db: Database.Database;
  private readonly stmt: Database.Statement;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA);
    this.stmt = this.db.prepare(
      `INSERT INTO orders (
        timestamp, mode, status, market_id, market_title, is_yes, is_buy,
        stake_usd, expected_price, fair_probability, edge_pct, order_ref,
        tx_signature, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
  }

  record(receipt: OrderReceipt): void {
    this.stmt.run(
      receipt.timestamp,
      receipt.mode,
      receipt.status,
      receipt.intent.marketId,
      receipt.intent.marketTitle,
      receipt.intent.isYes ? 1 : 0,
      receipt.intent.isBuy ? 1 : 0,
      receipt.intent.stakeUsd,
      receipt.intent.expectedPrice,
      receipt.intent.fairProbability,
      receipt.intent.edgePct,
      receipt.orderRef,
      receipt.txSignature ?? null,
      receipt.reason ?? null,
    );
  }

  recent(limit = 20): unknown[] {
    return this.db
      .prepare(`SELECT * FROM orders ORDER BY timestamp DESC LIMIT ?`)
      .all(limit);
  }

  close(): void {
    this.db.close();
  }
}
