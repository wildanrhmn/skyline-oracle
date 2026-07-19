import type { DashboardSnapshot } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";

export function DashboardShell({
  snap,
}: {
  snap: DashboardSnapshot;
}): React.ReactElement {
  const explorerBase = `https://explorer.solana.com/address`;
  const cluster = "?cluster=devnet";
  const kickoffLabel = (unixSec: number): string => {
    if (!unixSec) return "—";
    return new Date(unixSec * 1000).toISOString().slice(5, 16).replace("T", " ");
  };
  const publishedAgo = (ms: number): string => {
    if (!ms) return "—";
    const diff = Date.now() - ms;
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  };

  return (
    <div className="inner" style={{ paddingBottom: 80 }}>
      <div className="dash-head">
        <div>
          <span className="eyebrow">Terminal · devnet</span>
          <h1 className="dash-h1">Fair-value control room.</h1>
          <p className="dash-sub">
            Program{" "}
            <a
              href={`${explorerBase}/${snap.programPubkey}${cluster}`}
              target="_blank"
              rel="noopener"
            >
              <b>{shortenAddress(snap.programPubkey, 6, 4)}</b>
            </a>{" "}
            · publisher{" "}
            {snap.publisherPubkey ? (
              <a
                href={`${explorerBase}/${snap.publisherPubkey}${cluster}`}
                target="_blank"
                rel="noopener"
              >
                {shortenAddress(snap.publisherPubkey, 6, 4)}
              </a>
            ) : (
              <span style={{ color: "var(--faint)" }}>not registered</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            className={
              "chip " +
              (snap.status === "live" ? "live" : snap.status === "warn" ? "warn" : "")
            }
          >
            <span
              className={"status-dot" + (snap.status === "warn" ? " warn" : "")}
              style={{ width: 6, height: 6 }}
            />
            {snap.statusLabel}
          </span>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="k">Markets on-chain</div>
          <div className="v">{snap.markets.length}</div>
          <div className="h">MarketAccount PDAs</div>
        </div>
        <div className="kpi">
          <div className="k">Updates published</div>
          <div className="v up">{snap.updatesPublished}</div>
          <div className="h">PublisherRegistry counter</div>
        </div>
        <div className="kpi">
          <div className="k">Last publish</div>
          <div className="v">
            {snap.lastPublishAgoMs
              ? publishedAgo(Date.now() - snap.lastPublishAgoMs)
              : "—"}
          </div>
          <div className="h">newest FairValueUpdate</div>
        </div>
        <div className="kpi">
          <div className="k">Cluster</div>
          <div className="v">devnet</div>
          <div className="h">Solana</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <div>
            <h4>Live markets</h4>
            <div className="sub">
              Sharp-consensus · basis-point encoded · anyone can deserialize
            </div>
          </div>
          <a
            className="chip"
            href={`${explorerBase}/${snap.programPubkey}${cluster}`}
            target="_blank"
            rel="noopener"
            style={{ textTransform: "uppercase" }}
          >
            Program ↗
          </a>
        </div>
        {snap.markets.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              No markets published yet.
            </div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: 12,
                color: "var(--faint)",
              }}
            >
              Run{" "}
              <code
                style={{
                  color: "var(--positive)",
                  background: "rgba(34,197,94,0.08)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                pnpm exec tsx scripts/populate-oracle.ts
              </code>{" "}
              to publish live TxLINE consensus.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fixture</th>
                  <th style={{ textAlign: "right" }}>Home</th>
                  <th style={{ textAlign: "right" }}>Draw</th>
                  <th style={{ textAlign: "right" }}>Away</th>
                  <th style={{ textAlign: "right" }}>Updates</th>
                  <th style={{ textAlign: "right" }}>Last</th>
                  <th style={{ textAlign: "right" }}>PDA</th>
                </tr>
              </thead>
              <tbody>
                {snap.markets.map((m) => (
                  <tr key={m.marketPubkey}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {m.home}{" "}
                        <span style={{ color: "var(--faint)" }}>vs</span> {m.away}
                      </div>
                      <div className="meta">
                        #{m.fixture} · kickoff {kickoffLabel(m.kickoffTs)}z
                      </div>
                    </td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {(m.fairHome * 100).toFixed(1)}
                      <span style={{ color: "var(--faint)" }}>%</span>
                    </td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {(m.fairDraw * 100).toFixed(1)}
                      <span style={{ color: "var(--faint)" }}>%</span>
                    </td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {(m.fairAway * 100).toFixed(1)}
                      <span style={{ color: "var(--faint)" }}>%</span>
                    </td>
                    <td
                      className="num"
                      style={{ textAlign: "right", color: "var(--muted)" }}
                    >
                      {m.updateCount}
                    </td>
                    <td
                      className="num"
                      style={{ textAlign: "right", color: "var(--muted)" }}
                    >
                      {publishedAgo(m.lastPublishedMs)}
                    </td>
                    <td
                      className="num"
                      style={{ textAlign: "right" }}
                    >
                      <a
                        href={`${explorerBase}/${m.marketPubkey}${cluster}`}
                        target="_blank"
                        rel="noopener"
                        style={{ color: "var(--positive)" }}
                      >
                        {shortenAddress(m.marketPubkey, 4, 4)} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <div>
            <h4>Consuming Skyline Oracle</h4>
            <div className="sub">
              How any Solana program reads a market
            </div>
          </div>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "22px 24px",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12.5,
            lineHeight: 1.65,
            color: "var(--ink)",
            overflowX: "auto",
          }}
        >
          <code>
            <span style={{ color: "#f4c775" }}>use</span> anchor_lang::prelude::*;{"\n"}
            <span style={{ color: "#f4c775" }}>use</span> skyline_oracle::MarketAccount;{"\n\n"}
            <span style={{ color: "#f4c775" }}>pub fn</span> consume_price(ctx: Context&lt;Read&gt;) {"->"} Result&lt;()&gt; {"{"}{"\n"}
            {"    "}<span style={{ color: "var(--faint)" }}>// PDA seeds: [b"market", market_id]</span>{"\n"}
            {"    "}<span style={{ color: "#f4c775" }}>let</span> m: <span style={{ color: "#7dd3fc" }}>&Account&lt;MarketAccount&gt;</span> = &ctx.accounts.skyline_market;{"\n\n"}
            {"    "}<span style={{ color: "#f4c775" }}>let</span> home = m.current.home_prob_bps <span style={{ color: "#f4c775" }}>as f64</span> / <span style={{ color: "#a7f3d0" }}>10_000.0</span>;{"\n"}
            {"    "}<span style={{ color: "#f4c775" }}>let</span> draw = m.current.draw_prob_bps <span style={{ color: "#f4c775" }}>as f64</span> / <span style={{ color: "#a7f3d0" }}>10_000.0</span>;{"\n"}
            {"    "}<span style={{ color: "#f4c775" }}>let</span> away = m.current.away_prob_bps <span style={{ color: "#f4c775" }}>as f64</span> / <span style={{ color: "#a7f3d0" }}>10_000.0</span>;{"\n\n"}
            {"    "}<span style={{ color: "var(--faint)" }}>// use `home` / `draw` / `away` to price a bet, resolve a market, size a hedge…</span>{"\n"}
            {"    "}Ok(())
            {"\n}"}
          </code>
        </pre>
      </div>
    </div>
  );
}
