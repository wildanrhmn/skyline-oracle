import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Skyline — Sharp-consensus oracle on Solana";

export default function OG(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#020617",
          color: "#f8fafc",
          padding: 72,
          position: "relative",
          overflow: "hidden",
          fontFamily: "IBM Plex Sans",
        }}
      >
        {/* ambient glows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 600px at 12% 8%, rgba(244,199,117,0.16), transparent 60%), radial-gradient(800px 500px at 92% 90%, rgba(34,197,94,0.14), transparent 60%)",
            display: "flex",
          }}
        />
        {/* grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            display: "flex",
          }}
        />

        {/* top row: brand + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.35)",
              background: "rgba(34,197,94,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 32 32"
              fill="none"
              stroke="#22c55e"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 21 H29" strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
              <path d="M8 26 H24" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" />
              <path
                d="M9 21 L14 15 L19 18 L26 8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="26" cy="8" r="2" fill="#22c55e" stroke="none" />
            </svg>
          </div>
          <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", display: "flex" }}>
            Skyline
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: 999,
              color: "#22c55e",
              fontFamily: "JetBrains Mono",
              fontSize: 16,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#22c55e",
                display: "flex",
              }}
            />
            Live · devnet
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            marginTop: 96,
            fontSize: 84,
            fontWeight: 500,
            letterSpacing: "-0.028em",
            lineHeight: 1.02,
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", opacity: 0.55 }}>The market has a price.</div>
          <div style={{ display: "flex" }}>
            Skyline has the <span style={{ color: "#22c55e", paddingLeft: 22 }}>truth.</span>
          </div>
        </div>

        {/* bottom row: stats */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 48,
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            color: "rgba(226,232,240,0.65)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#f8fafc", fontSize: 30, fontWeight: 500 }}>120+</span>
            <span>books</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#f8fafc", fontSize: 30, fontWeight: 500 }}>10ms</span>
            <span>latency</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#f8fafc", fontSize: 30, fontWeight: 500 }}>104</span>
            <span>fixtures</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#22c55e", fontSize: 30, fontWeight: 500 }}>0</span>
            <span>middlemen</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
