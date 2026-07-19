import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONTS } from "./theme";

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Whole-scene fade: 14-frame ease in, 40-frame ease out (plus 18-frame tail
// gap so the transition can crossfade cleanly).
export function useSceneFade(
  dur: number,
  inLen = 14,
  outLen = 40,
  tail = 18,
): number {
  const frame = useCurrentFrame();
  const start = interpolate(frame, [0, inLen], [0, 1], {
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const end = interpolate(
    frame,
    [dur - outLen - tail, dur - tail],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );
  return start * end;
}

// Element fade-in with slight Y translation.
export const FadeUp: React.FC<{
  delay?: number;
  y?: number;
  duration?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 22, duration = 22, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, mass: 0.8 },
    durationInFrames: duration,
  });
  const opacity = interpolate(t, [0, 1], [0, 1]);
  const translate = interpolate(t, [0, 1], [y, 0]);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translate}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Reusable eyebrow — used above every scene headline.
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color = C.positive }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      fontFamily: FONTS.mono,
      fontSize: 20,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: C.muted,
    }}
  >
    <span
      style={{
        width: 32,
        height: 1,
        background: color,
      }}
    />
    {children}
  </div>
);

// Gradient text run (positive → accent → info)
export const GradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      background:
        "linear-gradient(96deg, #22c55e 0%, #f4c775 55%, #7dd3fc 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

// Persistent background: base gradient + faint grid + subtle green wash.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(1200px 900px at 78% ${-8 + shift * 0.1}%,
                            rgba(34,197,94,0.10), transparent 60%),
            radial-gradient(1400px 900px at 8% 96%,
                            rgba(244,199,117,0.05), transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.045) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 30%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 30%, black 30%, transparent 82%)",
        }}
      />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(2,6,23,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Meridian mark (SVG), same as the site nav / favicon.
export const MeridianMark: React.FC<{ size?: number; color?: string }> = ({
  size = 48,
  color = C.positive,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
  >
    <path
      d="M3 21 H29"
      strokeWidth="1.4"
      opacity="0.5"
      strokeLinecap="round"
    />
    <path
      d="M8 26 H24"
      strokeWidth="1.2"
      opacity="0.3"
      strokeLinecap="round"
    />
    <path
      d="M9 21 L14 15 L19 18 L26 8"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="26" cy="8" r="1.8" fill={color} stroke="none" />
  </svg>
);
