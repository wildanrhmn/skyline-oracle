"use client";
import { useEffect, useState } from "react";
import { MarkMeridian } from "@/components/logo/skyline-marks";

export function SiteNav({
  currentRoute,
}: {
  currentRoute?: "landing" | "dashboard";
}): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"nav-shell" + (scrolled ? " scrolled" : "")}>
      <div className="inner nav-inner">
        <a href="/" className="brand">
          <span className="mark">
            <MarkMeridian size={18} style={{ color: "var(--positive)" }} />
          </span>
          <span>Skyline</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--faint)",
              paddingLeft: 12,
              marginLeft: 12,
              borderLeft: "1px solid var(--border)",
            }}
          >
            v0.1 · devnet
          </span>
        </a>
        <nav className="nav-links">
          {currentRoute === "landing" ? (
            <>
              <a className="nav-link hide-sm" href="#method">Method</a>
              <a className="nav-link hide-sm" href="#oracle">Oracle</a>
              <a className="nav-link hide-sm" href="/dashboard">Terminal</a>
              <a
                className="nav-link hide-sm"
                href="https://github.com/wildanrhmn/skyline-oracle"
                target="_blank"
                rel="noopener"
              >
                Github
              </a>
            </>
          ) : (
            <>
              <a className="nav-link hide-sm" href="/">Home</a>
              <a
                className="nav-link hide-sm"
                href="https://explorer.solana.com/address/GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6?cluster=devnet"
                target="_blank"
                rel="noopener"
              >
                Explorer
              </a>
              <a
                className="nav-link hide-sm"
                href="https://github.com/wildanrhmn/skyline-oracle"
                target="_blank"
                rel="noopener"
              >
                Github
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
