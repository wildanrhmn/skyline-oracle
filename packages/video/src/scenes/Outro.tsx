import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, MeridianMark, useSceneFade } from "../lib";

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const opacity = useSceneFade(dur);
  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8vw",
      }}
    >
      <FadeUp delay={0} style={{ marginBottom: 42 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <MeridianMark size={72} />
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 76,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: C.ink,
            }}
          >
            Skyline
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={20} style={{ marginBottom: 60 }}>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 500,
              fontSize: 108,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: C.ink,
              margin: 0,
            }}
          >
            Sharp consensus,
            <br />
            <GradientText>on-chain.</GradientText>
          </h2>
        </div>
      </FadeUp>

      <FadeUp delay={60}>
        <div
          style={{
            display: "flex",
            gap: 32,
            fontFamily: FONTS.mono,
            fontSize: 22,
            color: C.muted,
            letterSpacing: "0.05em",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.faint,
                marginBottom: 8,
              }}
            >
              Live at
            </div>
            <div style={{ color: C.positive }}>
              skyline-fawn.vercel.app
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: C.line,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.faint,
                marginBottom: 8,
              }}
            >
              Source
            </div>
            <div style={{ color: C.info }}>
              github.com/wildanrhmn/skyline-oracle
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: C.line,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.faint,
                marginBottom: 8,
              }}
            >
              Program
            </div>
            <div style={{ color: C.accent }}>Gfqq…TK5c6 · devnet</div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={140} style={{ marginTop: 70 }}>
        <Eyebrow>TxODDS × Solana · World Cup Hackathon</Eyebrow>
      </FadeUp>
    </AbsoluteFill>
  );
};
