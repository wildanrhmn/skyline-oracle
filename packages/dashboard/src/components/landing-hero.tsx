"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DashboardSnapshot } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";

const EXPLORER = "https://explorer.solana.com/address";
const CLUSTER = "?cluster=devnet";

function publishedAgo(ms: number | null): string {
  if (!ms) return "no publishes yet";
  const diff = ms;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function LandingHero({
  snap,
}: {
  snap: DashboardSnapshot;
}): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const featured = snap.markets[0] ?? null;

  useGSAP(
    () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
      gsap.registerPlugin(ScrollTrigger);

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-eyebrow", { opacity: 0, y: 12, duration: 0.5 })
        .from(".hero-title", { opacity: 0, y: 16, duration: 0.7 }, "-=0.25")
        .from(".hero-sub", { opacity: 0, y: 12, duration: 0.55 }, "-=0.35")
        .from(
          ".hero-actions .btn",
          { opacity: 0, y: 10, duration: 0.5, stagger: 0.08 },
          "-=0.3",
        )
        .from(
          ".status-board .sb-row",
          { opacity: 0, x: 12, duration: 0.4, stagger: 0.06 },
          "-=0.35",
        );
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <section className="hero">
        <div className="inner">
          <div className="hero-grid">
            <div>
              <span className="eyebrow hero-eyebrow">
                <span className={"status-dot" + (snap.status === "warn" ? " warn" : "")} style={{ width: 6, height: 6 }} />
                {snap.statusLabel}
              </span>
              <h1 className="hero-title">
                Sharp consensus,
                <br />
                <em>on-chain.</em>
              </h1>
              <p className="hero-sub">
                Skyline reads TxLINE&apos;s cross-book sports consensus, publishes
                it to Solana as a <b>permissionless oracle</b>, and exposes
                fair-value probabilities as PDAs any Solana program can
                deserialize. Deterministic math, verifiable on-chain, zero
                middlemen.
              </p>
              <div className="hero-actions">
                <a className="btn primary" href="/dashboard">
                  Open the terminal
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
                <a
                  className="btn"
                  href={`${EXPLORER}/${snap.programPubkey}${CLUSTER}`}
                  target="_blank"
                  rel="noopener"
                >
                  Program on-chain
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17L17 7M17 7H8M17 7v9" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="status-board">
              <div className="sb-head">
                <span className="t">
                  {featured
                    ? `Live · ${featured.home} vs ${featured.away}`
                    : "Skyline Oracle · devnet"}
                </span>
                <span
                  className={
                    "status-dot" + (snap.status === "warn" ? " warn" : "")
                  }
                />
              </div>
              {featured ? (
                <>
                  <div className="sb-row">
                    <span className="k">Fair · home</span>
                    <span className="v up">
                      {(featured.fairHome * 100).toFixed(2)}%
                    </span>
                    <span className="chip">bps</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Fair · draw</span>
                    <span className="v">
                      {(featured.fairDraw * 100).toFixed(2)}%
                    </span>
                    <span className="chip">bps</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Fair · away</span>
                    <span className="v">
                      {(featured.fairAway * 100).toFixed(2)}%
                    </span>
                    <span className="chip">bps</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Updates</span>
                    <span className="v">{featured.updateCount}</span>
                    <span className="chip live">on-chain</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Last publish</span>
                    <span className="v">
                      {publishedAgo(Date.now() - featured.lastPublishedMs)}
                    </span>
                    <span className="chip">newest</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Market</span>
                    <span className="v">
                      <a
                        href={`${EXPLORER}/${featured.marketPubkey}${CLUSTER}`}
                        target="_blank"
                        rel="noopener"
                        style={{ color: "var(--positive)" }}
                      >
                        {shortenAddress(featured.marketPubkey, 4, 4)} ↗
                      </a>
                    </span>
                    <span className="chip">PDA</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="sb-row">
                    <span className="k">Program</span>
                    <span className="v">
                      {shortenAddress(snap.programPubkey, 4, 4)}
                    </span>
                    <span className="chip live">deployed</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Markets</span>
                    <span className="v">0</span>
                    <span className="chip">idle</span>
                  </div>
                  <div className="sb-row">
                    <span className="k">Updates</span>
                    <span className="v">{snap.updatesPublished}</span>
                    <span className="chip">publisher</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="blk" id="method">
        <div className="inner">
          <div className="blk-head">
            <span className="eyebrow">01 · Method</span>
            <div>
              <h2>
                Deterministic math.<br />
                <em>Every price is derived.</em>
              </h2>
              <p>
                Given the same book quotes, Skyline produces the same on-chain
                fair value. That&apos;s what makes it usable as infrastructure
                other Solana programs can rely on — no LLM, no black box.
              </p>
            </div>
          </div>
          <div className="method-row">
            <div className="method-cell">
              <span className="step">Step 01 · Ingest</span>
              <h3>TxLINE, streamed.</h3>
              <p>
                Skyline&apos;s engine subscribes to TxLINE&apos;s Server-Sent
                Events stream of StablePrice quotes across their bookmaker
                universe. Every update is Merkle-anchored on Solana for
                end-to-end verifiability.
              </p>
              <span className="formula">
                stream ← GET /api/odds/stream
              </span>
            </div>
            <div className="method-cell">
              <span className="step">Step 02 · De-vig</span>
              <h3>Shin method, per book.</h3>
              <p>
                Overround is stripped using Shin (1993), which models vig as
                insurance against informed bettors. More accurate than
                proportional removal for favourites and longshots.
              </p>
              <span className="formula">
                P̂ᵢ = (√(z² + 4(1−z)·pᵢ²/S) − z) / (2(1−z))
              </span>
            </div>
            <div className="method-cell">
              <span className="step">Step 03 · Consensus</span>
              <h3>Weighted by sharpness.</h3>
              <p>
                Sharp books heaviest, exchanges next, soft books discounted.
                The weighted average is written to Skyline Oracle in basis
                points via <code>publish_update</code>.
              </p>
              <span className="formula">P* = Σ wᵢ · P̂ᵢ / Σ wᵢ</span>
            </div>
          </div>
        </div>
      </section>

      <section className="blk" id="oracle" style={{ borderBottom: 0 }}>
        <div className="inner">
          <div className="blk-head">
            <span className="eyebrow">02 · The oracle</span>
            <div>
              <h2>
                Permissionless<br />
                <em>sports pricing.</em>
              </h2>
              <p>
                Skyline Oracle is a live Anchor program on Solana devnet. Every
                market publishes fair-value probabilities and confidence
                intervals as PDAs any other program can deserialize — no
                permission, no rate limit, no middleman.
              </p>
            </div>
          </div>
          <div className="oracle-spec">
            <div className="oracle-spec-bar">
              <span>skyline_oracle::MarketAccount</span>
              <span style={{ marginLeft: 12 }}>
                PDA seeds: [b&quot;market&quot;, market_id]
              </span>
              <span
                className={
                  "status-dot" + (snap.status === "warn" ? " warn" : "")
                }
              />
            </div>
            <pre>
              <code>
                <span className="tk-c">pub struct</span>{" "}
                <span className="tk-b">MarketAccount</span> {"{"}
                {"\n"}
                {"    "}
                <span className="tk-m">/// on-chain market identity</span>
                {"\n"}
                {"    "}market_id: <span className="tk-b">[u8; 32]</span>,{"\n"}
                {"    "}fixture_id: <span className="tk-b">u64</span>,{"\n"}
                {"    "}home: <span className="tk-b">String</span>,{"  "}away:{" "}
                <span className="tk-b">String</span>,{"\n"}
                {"    "}kickoff_ts: <span className="tk-b">i64</span>,{"\n\n"}
                {"    "}
                <span className="tk-m">
                  /// latest sharp-consensus snapshot
                </span>
                {"\n"}
                {"    "}current: <span className="tk-b">FairValueUpdate</span>{" "}
                {"{"}
                {"\n"}
                {"        "}home_prob_bps: <span className="tk-b">u16</span>,
                {"     "}
                <span className="tk-m">// e.g. 4205 = 42.05%</span>
                {"\n"}
                {"        "}draw_prob_bps: <span className="tk-b">u16</span>,
                {"\n"}
                {"        "}away_prob_bps: <span className="tk-b">u16</span>,
                {"\n"}
                {"        "}txline_proof_ref:{" "}
                <span className="tk-b">[u8; 32]</span>,{"\n"}
                {"        "}published_at: <span className="tk-b">i64</span>,
                {"\n"}
                {"    }"},{"\n\n"}
                {"    "}publisher: <span className="tk-b">Pubkey</span>,{"\n"}
                {"    "}update_count: <span className="tk-b">u64</span>,{"\n"}
                {"}"}
                {"\n\n"}
                <span className="tk-m">
                  // Any Solana program can fetch the account and consume the price.
                </span>
              </code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
