import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Load with weights we actually use
loadPlex("normal", { weights: ["400", "500", "600", "700"] });
loadMono("normal", { weights: ["400", "500"] });

export const FONTS = {
  sans: 'IBMPlexSans, "IBM Plex Sans", Inter, system-ui, sans-serif',
  mono: 'JetBrainsMono, "JetBrains Mono", ui-monospace, monospace',
};

// Dark-OLED palette (matches the deployed dashboard)
export const C = {
  bg: "#020617",
  surface: "#0b1120",
  surface2: "#131a2e",
  line: "rgba(51, 65, 85, 0.55)",
  lineStrong: "rgba(148, 163, 184, 0.28)",
  ink: "#f8fafc",
  muted: "rgba(226,232,240,0.75)",
  faint: "rgba(148,163,184,0.65)",
  positive: "#22c55e",
  accent: "#f4c775",
  info: "#7dd3fc",
  violet: "#a889ff",
  negative: "#ef4444",
};

// Meridian-green wordmark gradient — mirrors the dashboard's brand
export const GRAD = `linear-gradient(96deg, ${C.positive} 0%, ${C.accent} 55%, ${C.info} 100%)`;
