import { SiteNav } from "@/components/site-nav";
import { LandingHero } from "@/components/landing-hero";
import { buildSnapshot } from "@/lib/data";
import { shortenAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const snap = await buildSnapshot();
  return (
    <div>
      <SiteNav currentRoute="landing" />
      <main>
        <LandingHero snap={snap} />
      </main>
      <footer>
        <div className="inner">
          <div className="foot-row">
            <span>
              Skyline Oracle · Solana devnet ·{" "}
              <span style={{ color: "var(--muted)" }}>
                {shortenAddress(snap.programPubkey, 4, 4)}
              </span>
            </span>
            <span style={{ display: "flex", gap: 20 }}>
              <a
                href="https://github.com/wildanrhmn/skyline-oracle"
                target="_blank"
                rel="noopener"
              >
                github
              </a>
              <a
                href={`https://explorer.solana.com/address/${snap.programPubkey}?cluster=devnet`}
                target="_blank"
                rel="noopener"
              >
                explorer
              </a>
              <a href="/dashboard">terminal</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
