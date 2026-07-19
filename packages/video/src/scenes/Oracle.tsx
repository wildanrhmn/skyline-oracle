import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONTS } from "../theme";
import { Eyebrow, FadeUp, GradientText, useSceneFade } from "../lib";

const CODE = [
  { c: "pub struct", t: "keyword" },
  { c: " MarketAccount ", t: "type" },
  { c: "{", t: "" },
  { br: true },
  { c: "    market_id: ", t: "" },
  { c: "[u8; 32]", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "    fixture_id: ", t: "" },
  { c: "u64", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "    home: ", t: "" },
  { c: "String", t: "type" },
  { c: ",  away: ", t: "" },
  { c: "String", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "    current: ", t: "" },
  { c: "FairValueUpdate", t: "type" },
  { c: " {", t: "" },
  { br: true },
  { c: "        home_prob_bps: ", t: "" },
  { c: "4205", t: "num" },
  { c: ",   ", t: "" },
  { c: "// 42.05%", t: "comment" },
  { br: true },
  { c: "        draw_prob_bps: ", t: "" },
  { c: "3121", t: "num" },
  { c: ",   ", t: "" },
  { c: "// 31.21%", t: "comment" },
  { br: true },
  { c: "        away_prob_bps: ", t: "" },
  { c: "2674", t: "num" },
  { c: ",   ", t: "" },
  { c: "// 26.74%", t: "comment" },
  { br: true },
  { c: "        txline_proof_ref: ", t: "" },
  { c: "[u8; 32]", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "        published_at: ", t: "" },
  { c: "i64", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "    },", t: "" },
  { br: true },
  { c: "    publisher: ", t: "" },
  { c: "Pubkey", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "    update_count: ", t: "" },
  { c: "u64", t: "type" },
  { c: ",", t: "" },
  { br: true },
  { c: "}", t: "" },
];

const COLOR: Record<string, string> = {
  keyword: C.accent,
  type: C.info,
  num: "#a7f3d0",
  comment: C.faint,
};

export const Oracle: React.FC<{ dur: number }> = ({ dur }) => {
  const opacity = useSceneFade(dur);
  const frame = useCurrentFrame();

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
        <Eyebrow>03 · The oracle</Eyebrow>
      </FadeUp>
      <FadeUp delay={16}>
        <h2
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 500,
            fontSize: 92,
            lineHeight: 1.03,
            letterSpacing: "-0.028em",
            color: C.ink,
            margin: 0,
            marginBottom: 44,
            textAlign: "center",
          }}
        >
          Pyth for <GradientText>sports outcomes.</GradientText>
        </h2>
      </FadeUp>

      <FadeUp delay={44}>
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            background: "rgba(11,17,32,0.9)",
            boxShadow: "0 40px 120px -50px rgba(0,0,0,0.9)",
            maxWidth: 1400,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 24px",
              borderBottom: `1px solid ${C.line}`,
              background: "rgba(255,255,255,0.02)",
              fontFamily: FONTS.mono,
              fontSize: 18,
              color: C.muted,
              letterSpacing: "0.06em",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ef4444" }} />
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#f4c775" }} />
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#22c55e" }} />
            <span style={{ marginLeft: 8 }}>skyline_oracle::MarketAccount</span>
            <span style={{ marginLeft: "auto", color: C.positive }}>· devnet</span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "34px 40px",
              fontFamily: FONTS.mono,
              fontSize: 26,
              lineHeight: 1.55,
              color: C.ink,
              whiteSpace: "pre",
              overflow: "hidden",
            }}
          >
            {CODE.map((tok, i) => {
              const reveal = interpolate(
                frame,
                [44 + i * 4, 44 + i * 4 + 8],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              if (tok.br) return <span key={i}>{"\n"}</span>;
              return (
                <span
                  key={i}
                  style={{
                    opacity: reveal,
                    color: tok.t ? COLOR[tok.t] : C.ink,
                  }}
                >
                  {tok.c}
                </span>
              );
            })}
          </pre>
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
