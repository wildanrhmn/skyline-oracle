import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, useSceneFade } from "../lib";

const LAYERS = [
  {
    step: "Layer 2",
    title: "Fair-Value Engine",
    sub: "TxLINE StablePrice consensus, Shin de-vig, sharpness-weighted",
    tint: C.info,
  },
  {
    step: "Layer 1",
    title: "Skyline Oracle",
    sub: "Anchor program on Solana devnet, PDAs anyone can read",
    tint: C.positive,
  },
  {
    step: "Layer 3",
    title: "Autonomous Trader",
    sub: "Fractional Kelly, portfolio risk manager, sim + live executors",
    tint: C.accent,
  },
];

export const Architecture: React.FC<{ dur: number }> = ({ dur }) => {
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
        <Eyebrow>02 · The system</Eyebrow>
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
            marginBottom: 90,
            textAlign: "center",
          }}
        >
          Three layers. <GradientText>One signal.</GradientText>
        </h2>
      </FadeUp>

      <div
        style={{
          display: "flex",
          gap: 26,
          alignItems: "stretch",
          maxWidth: 1720,
          width: "100%",
        }}
      >
        {LAYERS.map((l, i) => {
          const start = 44 + i * 22;
          const s = spring({
            frame: frame - start,
            fps,
            config: { damping: 22, mass: 0.7 },
            durationInFrames: 26,
          });
          const y = interpolate(s, [0, 1], [40, 0]);
          return (
            <div
              key={l.step}
              style={{
                flex: 1,
                border: `1px solid ${C.line}`,
                borderRadius: 18,
                padding: "38px 34px",
                background: "rgba(255,255,255,0.02)",
                position: "relative",
                overflow: "hidden",
                opacity: s,
                transform: `translateY(${y}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: l.tint,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 16,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: l.tint,
                  marginBottom: 18,
                }}
              >
                {l.step}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 40,
                  fontWeight: 500,
                  color: C.ink,
                  letterSpacing: "-0.015em",
                  marginBottom: 18,
                  lineHeight: 1.1,
                }}
              >
                {l.title}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 22,
                  lineHeight: 1.5,
                  color: C.muted,
                }}
              >
                {l.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signal-flow arrows */}
      <FadeUp delay={140} style={{ marginTop: 40 }}>
        <div
          style={{
            display: "flex",
            gap: 30,
            alignItems: "center",
            fontFamily: FONTS.mono,
            fontSize: 20,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.faint,
          }}
        >
          <span>TxLINE</span>
          <span style={{ color: C.positive }}>→</span>
          <span>Engine</span>
          <span style={{ color: C.positive }}>→</span>
          <span>Oracle</span>
          <span style={{ color: C.positive }}>→</span>
          <span>Trader</span>
          <span style={{ color: C.positive }}>→</span>
          <span>Jupiter</span>
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
