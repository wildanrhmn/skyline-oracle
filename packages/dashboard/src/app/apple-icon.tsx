import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          borderRadius: 36,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 36,
            background:
              "radial-gradient(circle at 22% 18%, rgba(244,199,117,0.28), transparent 55%), radial-gradient(circle at 82% 84%, rgba(34,197,94,0.24), transparent 55%)",
            display: "flex",
          }}
        />
        <svg
          width="128"
          height="128"
          viewBox="0 0 32 32"
          fill="none"
          stroke="#f8fafc"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "relative", zIndex: 1 }}
        >
          <path d="M3 21 H29" strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
          <path d="M8 26 H24" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" />
          <path
            d="M9 21 L14 15 L19 18 L26 8"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="8" r="1.9" fill="#f8fafc" stroke="none" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
