import { EventEmitter } from "node:events";
import { logger } from "../logger.js";

/**
 * SSE stream reader for TxLINE odds and scores.
 * Uses the Fetch API directly (undici under Node 22) — the browser EventSource
 * cannot set custom headers, and we need Authorization + X-Api-Token.
 *
 * Implements resume-from-Last-Event-ID for graceful reconnection.
 */

export interface TxLineStreamOptions {
  baseUrl: string;
  jwt: string;
  apiToken: string;
  path: "/api/odds/stream" | "/api/scores/stream";
  fixtureId?: number;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  onReauth?: () => Promise<string>;
}

export interface StreamEvent<T = unknown> {
  id?: string;
  event?: string;
  data: T;
}

export class TxLineStream extends EventEmitter {
  private abort = new AbortController();
  private lastEventId: string | undefined;
  private closed = false;
  private jwt: string;
  private backoffMs: number;
  private readonly maxBackoffMs: number;

  constructor(private readonly opts: TxLineStreamOptions) {
    super();
    this.jwt = opts.jwt;
    this.backoffMs = opts.reconnectDelayMs ?? 1000;
    this.maxBackoffMs = opts.maxReconnectDelayMs ?? 30_000;
  }

  async start(): Promise<void> {
    while (!this.closed) {
      try {
        await this.connectOnce();
        this.backoffMs = this.opts.reconnectDelayMs ?? 1000;
      } catch (err) {
        if (this.closed) return;
        const status = (err as { status?: number }).status;
        if (status === 401 && this.opts.onReauth) {
          logger.warn("TxLINE stream 401 — renewing JWT");
          try {
            this.jwt = await this.opts.onReauth();
            continue;
          } catch (renewErr) {
            logger.error({ renewErr }, "JWT renew failed");
          }
        }
        logger.warn({ err, backoffMs: this.backoffMs }, "TxLINE stream error; reconnecting");
        await sleep(this.backoffMs);
        this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
      }
    }
  }

  close(): void {
    this.closed = true;
    this.abort.abort();
    this.emit("close");
  }

  private async connectOnce(): Promise<void> {
    const url = new URL(this.opts.baseUrl + this.opts.path);
    if (this.opts.fixtureId !== undefined) {
      url.searchParams.set("fixtureId", String(this.opts.fixtureId));
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.jwt}`,
      "X-Api-Token": this.opts.apiToken,
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      "Accept-Encoding": "gzip",
    };
    if (this.lastEventId) headers["Last-Event-ID"] = this.lastEventId;

    this.abort = new AbortController();
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: this.abort.signal,
    });
    if (!res.ok || !res.body) {
      const err = new Error(`SSE HTTP ${res.status}: ${await res.text()}`);
      (err as { status?: number }).status = res.status;
      throw err;
    }

    logger.info({ path: this.opts.path, fixtureId: this.opts.fixtureId }, "SSE connected");

    const decoder = new TextDecoder();
    let buffer = "";
    const reader = res.body.getReader();
    while (!this.closed) {
      const { done, value } = await reader.read();
      if (done) throw new Error("SSE stream ended by server");
      buffer += decoder.decode(value, { stream: true });
      let sep = buffer.indexOf("\n\n");
      while (sep !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const evt = parseSseBlock(raw);
        if (evt) this.emitEvent(evt);
        sep = buffer.indexOf("\n\n");
      }
    }
  }

  private emitEvent(evt: StreamEvent<string>): void {
    if (evt.id) this.lastEventId = evt.id;
    if (evt.event === "heartbeat") {
      this.emit("heartbeat", evt);
      return;
    }
    if (!evt.data) return;
    try {
      const parsed = JSON.parse(evt.data);
      this.emit("data", { ...evt, data: parsed });
    } catch (err) {
      logger.warn({ err, raw: evt.data.slice(0, 200) }, "SSE data parse failed");
    }
  }
}

function parseSseBlock(block: string): StreamEvent<string> | null {
  const evt: StreamEvent<string> = { data: "" };
  let hasData = false;
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    const idx = line.indexOf(":");
    const field = idx === -1 ? line : line.slice(0, idx);
    let value = idx === -1 ? "" : line.slice(idx + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    switch (field) {
      case "id":
        evt.id = value;
        break;
      case "event":
        evt.event = value;
        break;
      case "data":
        dataLines.push(value);
        hasData = true;
        break;
    }
  }
  if (!hasData && !evt.event) return null;
  evt.data = dataLines.join("\n");
  return evt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
