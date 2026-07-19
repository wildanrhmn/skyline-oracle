import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, useSceneFade } from "../lib";

const LEFT = [
  { k: "Books aggregated", v: "120+" },
  { k: "Latency", v: "10ms" },
  { k: "Vig-removal", v: "Shin (1993)" },
  { k: "Consensus math", v: "Sharp-weighted" },
];

const RIGHT = [
  { k: "Order-book depth", v: "Thin" },
  { k: "Price discovery", v: "Slow" },
  { k: "Cross-venue", v: "Fragmented" },
  { k: "Institutional data", v: "None" },
];

export const Problem: React.FC<{ dur: number }> = ({ dur }) => {
  const opacity = useSceneFade(dur);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8vw",
      }}
    >
      <FadeUp delay={0} style={{ marginBottom: 34 }}>
        <Eyebrow>01 · The problem</Eyebrow>
      </FadeUp>
      <FadeUp delay={16}>
        <h2
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 100,
            lineHeight: 1.03,
            letterSpacing: "-0.028em",
            color: C.ink,
            margin: 0,
            marginBottom: 70,
            textAlign: "center",
          }}
        >
          Two markets, <GradientText>never priced together.</GradientText>
        </h2>
      </FadeUp>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 44,
          alignItems: "stretch",
          width: "100%",
          maxWidth: 1500,
        }}
      >
        {/* Left column: sportsbooks */}
        <FadeUp delay={40}>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 34,
              background: "rgba(255,255,255,0.015)",
              height: "100%",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 15,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.positive,
                marginBottom: 22,
              }}
            >
              Sportsbooks
            </div>
            {LEFT.map((r, i) => {
              const start = 60 + i * 10;
              const t = interpolate(
                frame,
                [start, start + 22],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={r.k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "14px 0",
                    borderBottom:
                      i < LEFT.length - 1 ? `1px solid ${C.line}` : "none",
                    opacity: t,
                    transform: `translateX(${(1 - t) * -12}px)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 20,
                      color: C.muted,
                    }}
                  >
                    {r.k}
                  </span>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 24,
                      color: C.ink,
                    }}
                  >
                    {r.v}
                  </span>
                </div>
              );
            })}
          </div>
        </FadeUp>

        {/* Center divider with "vs" and gap indicator */}
        <FadeUp delay={80}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
              padding: "0 8px",
            }}
          >
            <div
              style={{
                width: 2,
                height: 90,
                background: `linear-gradient(180deg, transparent, ${C.line}, transparent)`,
              }}
            />
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 18,
                letterSpacing: "0.2em",
                color: C.accent,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Gap
            </div>
            <div
              style={{
                width: 2,
                height: 90,
                background: `linear-gradient(180deg, transparent, ${C.line}, transparent)`,
              }}
            />
          </div>
        </FadeUp>

        {/* Right column: on-chain */}
        <FadeUp delay={40}>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 34,
              background: "rgba(255,255,255,0.015)",
              height: "100%",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 15,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.negative,
                marginBottom: 22,
              }}
            >
              On-chain markets
            </div>
            {RIGHT.map((r, i) => {
              const start = 60 + i * 10;
              const t = interpolate(
                frame,
                [start, start + 22],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              return (
                <div
                  key={r.k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "14px 0",
                    borderBottom:
                      i < RIGHT.length - 1 ? `1px solid ${C.line}` : "none",
                    opacity: t,
                    transform: `translateX(${(1 - t) * 12}px)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 20,
                      color: C.muted,
                    }}
                  >
                    {r.k}
                  </span>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 24,
                      color: C.ink,
                    }}
                  >
                    {r.v}
                  </span>
                </div>
              );
            })}
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
