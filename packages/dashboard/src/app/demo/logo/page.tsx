"use client";
import { useRef, useState } from "react";
import { MARKS, type MarkId } from "@/components/logo/skyline-marks";
import { cn } from "@/lib/utils";

export default function LogoDemoPage(): React.ReactElement {
  const [selected, setSelected] = useState<MarkId>("meridian");
  const current = MARKS.find((m) => m.id === selected)!;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="inner" style={{ paddingTop: 72, paddingBottom: 96, maxWidth: 960 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Demo · branding
        </div>
        <h1
          style={{
            fontFamily: "var(--font-plex-sans)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 500,
            letterSpacing: "-0.028em",
            margin: "8px 0 14px",
            lineHeight: 1.05,
            color: "var(--ink)",
          }}
        >
          Skyline identity
        </h1>
        <p
          style={{
            maxWidth: 620,
            color: "var(--muted)",
            fontSize: 14.5,
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Four directions for the mark, all in the ink-and-signal language of the terminal. Skyline is an oracle —
          a fixed point on the horizon between many markets — so every option reads as something{" "}
          <em style={{ color: "var(--ink)", fontStyle: "normal" }}>observed</em> or{" "}
          <em style={{ color: "var(--positive)", fontStyle: "normal" }}>resolved</em>. Pick one below and export the
          1024×1024 asset; I&apos;ll then wire it through the header, favicon, and the rest of the app.
        </p>

        <div className="mark-grid">
          {MARKS.map((opt) => {
            const Mark = opt.Mark;
            const active = opt.id === selected;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={cn("mark-card", active && "mark-card-active")}
                type="button"
              >
                <div className="mark-card-head">
                  <span className="mark-card-title">{opt.label}</span>
                  <span className={cn("mark-card-pill", active && "mark-card-pill-active")}>
                    {active ? "selected" : "select"}
                  </span>
                </div>
                <p className="mark-card-sub">{opt.sub}</p>

                <div className="mark-swatches">
                  <div className="mark-swatch mark-swatch-dark">
                    <Mark size={64} style={{ color: "var(--positive)" }} />
                  </div>
                  <div className="mark-swatch mark-swatch-light">
                    <Mark size={64} style={{ color: "#020617" }} />
                  </div>
                </div>

                <div className="mark-lockup">
                  <Mark size={22} style={{ color: "var(--ink)" }} />
                  <span className="lockup-wordmark">Skyline</span>
                  <span className="lockup-scale">
                    {[16, 20, 28].map((s) => (
                      <Mark
                        key={s}
                        size={s}
                        style={{ color: "rgba(34,197,94,0.7)" }}
                      />
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <Submission id={selected} label={current.label} />
      </div>

      <style>{`
        .mark-grid {
          margin-top: 42px;
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 720px) { .mark-grid { grid-template-columns: 1fr; } }

        .mark-card {
          appearance: none;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          color: inherit;
          font: inherit;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mark-card:hover { border-color: var(--border-strong); }
        .mark-card-active {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(34, 197, 94, 0.04);
        }
        .mark-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .mark-card-title {
          font-family: var(--font-plex-sans);
          font-size: 16px;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: -0.01em;
        }
        .mark-card-pill {
          font-family: var(--font-jetbrains);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px 9px;
          color: var(--faint);
        }
        .mark-card-pill-active {
          border-color: rgba(34, 197, 94, 0.55);
          color: var(--positive);
        }
        .mark-card-sub {
          font-size: 12.5px;
          line-height: 1.55;
          color: var(--muted);
          margin: 0;
          min-height: 52px;
        }
        .mark-swatches {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .mark-swatch {
          height: 112px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mark-swatch-dark { background: #020617; border: 1px solid var(--border); }
        .mark-swatch-light { background: #f8fafc; border: 1px solid var(--border); }

        .mark-lockup {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
        }
        .lockup-wordmark {
          font-family: var(--font-plex-sans);
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 0.005em;
          color: var(--ink);
        }
        .lockup-scale {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--faint);
        }
      `}</style>
    </div>
  );
}

function Submission({
  id,
  label,
}: {
  id: MarkId;
  label: string;
}): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState(false);

  const exportPng = async (): Promise<void> => {
    if (!svgRef.current || busy) return;
    setBusy(true);
    try {
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      const svg = `<?xml version="1.0" encoding="UTF-8"?>${xml}`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `skyline-logo-${id}-1024.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.alert("PNG export failed — use the SVG download and convert in any browser.");
    } finally {
      setBusy(false);
    }
  };

  const downloadSvg = (): void => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>${xml}`],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skyline-logo-${id}-1024.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 56, borderTop: "1px solid var(--border)", paddingTop: 40 }}>
      <div className="eyebrow">Submission asset</div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--font-plex-sans)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {label} · 1024×1024
      </div>
      <p
        style={{
          marginTop: 6,
          maxWidth: 560,
          fontSize: 13.5,
          color: "var(--muted)",
          lineHeight: 1.55,
        }}
      >
        Ink base with a faint dot grid, a green settlement glow bottom-right, an amber horizon glow top-left, and the mark struck in bone at the center. Mark only — the submission renders the name underneath.
      </p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
          alignItems: "start",
        }}
        className="sub-grid"
      >
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
          <SubmissionSvg ref={svgRef} id={id} display={320} />
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>
            The export renders this exact composition to a 1024×1024 canvas. PNG for uploads, SVG for anywhere.
          </p>
          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              onClick={exportPng}
              disabled={busy}
              className="btn primary"
              style={{ opacity: busy ? 0.4 : 1 }}
              type="button"
            >
              {busy ? "Rendering…" : "Download 1024 PNG"}
            </button>
            <button onClick={downloadSvg} className="btn" type="button">
              Download SVG
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .sub-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

interface SubmissionSvgProps {
  id: MarkId;
  display: number;
}

function SubmissionSvg({
  ref,
  id,
  display,
}: SubmissionSvgProps & { ref: React.Ref<SVGSVGElement> }): React.ReactElement {
  const Mark = MARKS.find((m) => m.id === id)!.Mark;
  return (
    <svg
      ref={ref}
      width={display}
      height={display}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="skHorizon" cx="0.22" cy="0.18" r="0.55">
          <stop offset="0%" stopColor="#f4c775" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#f4c775" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="skSettle" cx="0.82" cy="0.84" r="0.55">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <pattern id="skGrid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path
            d="M64 0 H0 V64"
            fill="none"
            stroke="#f8fafc"
            strokeOpacity="0.045"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="1024" height="1024" rx="180" fill="#020617" />
      <rect width="1024" height="1024" rx="180" fill="url(#skGrid)" />
      <rect width="1024" height="1024" rx="180" fill="url(#skHorizon)" />
      <rect width="1024" height="1024" rx="180" fill="url(#skSettle)" />
      <rect
        x="2"
        y="2"
        width="1020"
        height="1020"
        rx="178"
        fill="none"
        stroke="#22c55e"
        strokeOpacity="0.32"
        strokeWidth="2"
      />
      <Mark
        x={172}
        y={172}
        width={680}
        height={680}
        stroke="#f8fafc"
      />
    </svg>
  );
}
