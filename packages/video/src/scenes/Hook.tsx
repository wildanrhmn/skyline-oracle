import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, useSceneFade } from "../lib";

const STATS = [
  { label: "Sports betting", value: "$200B", tint: C.ink },
  { label: "Prediction markets", value: "$12B/mo", tint: C.ink },
  { label: "The gap", value: "→", tint: C.positive, isArrow: true },
  { label: "On-chain bridge", value: "0", tint: C.negative, strike: true },
];

export const Hook: React.FC<{ dur: number }> = ({ dur }) => {
  const opacity = useSceneFade(dur);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 12vw",
      }}
    >
      <FadeUp delay={0} style={{ marginBottom: 60 }}>
        <Eyebrow>The market has a price</Eyebrow>
      </FadeUp>
      <FadeUp delay={16}>
        <h1
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 132,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: C.ink,
            margin: 0,
            textAlign: "center",
          }}
        >
          Skyline has the <GradientText>truth.</GradientText>
        </h1>
      </FadeUp>

      <FadeUp delay={60} style={{ marginTop: 90 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 24,
            width: "100%",
            maxWidth: 1400,
          }}
        >
          {STATS.map((s, i) => {
            const start = 90 + i * 14;
            const t = interpolate(
              frame,
              [start, start + 26],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <div
                key={s.label}
                style={{
                  opacity: t,
                  transform: `translateY(${(1 - t) * 20}px)`,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.02)",
                  padding: "28px 26px",
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 15,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: C.faint,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 56,
                    fontWeight: 400,
                    marginTop: 14,
                    color: s.tint,
                    letterSpacing: "-0.01em",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  {s.value}
                  {s.strike && (
                    <div
                      style={{
                        position: "absolute",
                        left: -4,
                        right: -4,
                        top: "55%",
                        height: 4,
                        background: C.negative,
                        transform: "rotate(-6deg)",
                        borderRadius: 2,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
