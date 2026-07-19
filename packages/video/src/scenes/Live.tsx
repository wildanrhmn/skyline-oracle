import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, useSceneFade } from "../lib";

const MARKETS = [
  {
    home: "France",
    away: "England",
    fixture: "18257865",
    home_prob: 39.25,
    draw_prob: 37.06,
    away_prob: 23.69,
    kickoff: "07-18 21:00z",
  },
  {
    home: "Spain",
    away: "Argentina",
    fixture: "18257739",
    home_prob: 42.05,
    draw_prob: 31.21,
    away_prob: 26.74,
    kickoff: "07-19 19:00z",
  },
];

const Chip: React.FC<{ label: string; value: string; tint?: string; delay?: number }> = ({
  label,
  value,
  tint = C.info,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22 },
    durationInFrames: 22,
  });
  return (
    <div
      style={{
        opacity: sp,
        transform: `translateY(${(1 - sp) * 10}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "18px 24px",
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.faint,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 30,
          color: tint,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const Live: React.FC<{ dur: number }> = ({ dur }) => {
  const opacity = useSceneFade(dur);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6vw",
      }}
    >
      <FadeUp delay={0} style={{ marginBottom: 34 }}>
        <Eyebrow>05 · Live on devnet</Eyebrow>
      </FadeUp>
      <FadeUp delay={16}>
        <h2
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 96,
            lineHeight: 1.03,
            letterSpacing: "-0.028em",
            color: C.ink,
            margin: 0,
            marginBottom: 44,
            textAlign: "center",
          }}
        >
          Two markets. <GradientText>Real fair-values.</GradientText>
        </h2>
      </FadeUp>

      <FadeUp delay={44}>
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 44,
            justifyContent: "center",
          }}
        >
          <Chip label="Program" value="Gfqq…TK5c6" tint={C.positive} delay={44} />
          <Chip label="Cluster" value="devnet" tint={C.ink} delay={54} />
          <Chip label="Markets on-chain" value="2" tint={C.positive} delay={64} />
          <Chip label="Updates" value="2" tint={C.accent} delay={74} />
        </div>
      </FadeUp>

      <div
        style={{
          display: "flex",
          gap: 20,
          width: "100%",
          maxWidth: 1500,
        }}
      >
        {MARKETS.map((m, mi) => {
          const start = 100 + mi * 30;
          const sp = spring({
            frame: frame - start,
            fps,
            config: { damping: 24 },
            durationInFrames: 26,
          });
          return (
            <div
              key={m.fixture}
              style={{
                flex: 1,
                opacity: sp,
                transform: `translateY(${(1 - sp) * 22}px)`,
                border: `1px solid ${C.line}`,
                borderRadius: 16,
                padding: "32px 36px",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 40,
                  fontWeight: 500,
                  color: C.ink,
                  letterSpacing: "-0.015em",
                }}
              >
                {m.home}{" "}
                <span style={{ color: C.faint, fontSize: 30 }}>vs</span> {m.away}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.faint,
                  marginTop: 10,
                }}
              >
                #{m.fixture} · kickoff {m.kickoff}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 16,
                  marginTop: 26,
                }}
              >
                {[
                  { k: "Home", v: m.home_prob },
                  { k: "Draw", v: m.draw_prob },
                  { k: "Away", v: m.away_prob },
                ].map((c, i) => {
                  const cell = interpolate(
                    frame,
                    [start + 16 + i * 6, start + 30 + i * 6],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  return (
                    <div
                      key={c.k}
                      style={{
                        opacity: cell,
                        padding: "16px 18px",
                        border: `1px solid ${C.line}`,
                        borderRadius: 10,
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 13,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: C.faint,
                        }}
                      >
                        {c.k}
                      </div>
                      <div
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 34,
                          marginTop: 8,
                          color: C.ink,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {c.v.toFixed(2)}
                        <span style={{ color: C.faint }}>%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
