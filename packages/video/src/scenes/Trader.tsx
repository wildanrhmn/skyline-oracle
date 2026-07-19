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

const STEPS = [
  {
    title: "De-vig",
    formula: "P̂ᵢ = (√(z² + 4(1−z)·pᵢ²/S) − z) / (2(1−z))",
    hint: "Shin (1993)",
  },
  {
    title: "Consensus",
    formula: "P* = Σ wᵢ · P̂ᵢ / Σ wᵢ",
    hint: "sharp-weighted",
  },
  {
    title: "Kelly stake",
    formula: "f* = ¼ · (p(1−c) − (1−p)c) / ((1−c)·c)",
    hint: "fractional",
  },
  {
    title: "Risk gate",
    formula: "stake ≤ min(bankroll · cap, per-match cap)",
    hint: "portfolio VAR",
  },
];

export const Trader: React.FC<{ dur: number }> = ({ dur }) => {
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
        <Eyebrow>04 · The trader</Eyebrow>
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
            marginBottom: 66,
            textAlign: "center",
          }}
        >
          Math, not <GradientText>vibes.</GradientText>
        </h2>
      </FadeUp>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          maxWidth: 1500,
          width: "100%",
        }}
      >
        {STEPS.map((s, i) => {
          const start = 44 + i * 24;
          const sp = spring({
            frame: frame - start,
            fps,
            config: { damping: 22, mass: 0.8 },
            durationInFrames: 26,
          });
          return (
            <div
              key={s.title}
              style={{
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
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
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 14,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.faint,
                  }}
                >
                  {s.hint}
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  color: C.accent,
                  marginTop: 22,
                  lineHeight: 1.55,
                  wordBreak: "break-word",
                }}
              >
                {s.formula}
              </div>
            </div>
          );
        })}
      </div>

      <FadeUp delay={160} style={{ marginTop: 46 }}>
        <div
          style={{
            display: "inline-flex",
            gap: 22,
            padding: "18px 26px",
            border: `1px solid ${C.lineStrong}`,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            fontFamily: FONTS.mono,
            fontSize: 22,
            color: C.muted,
            letterSpacing: "0.05em",
          }}
        >
          <span>TRADER_MODE=</span>
          <span style={{ color: C.info }}>sim</span>
          <span style={{ color: C.faint }}>|</span>
          <span style={{ color: C.positive }}>real</span>
          <span>·</span>
          <span>one env flag</span>
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
