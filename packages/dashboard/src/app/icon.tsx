import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon(): ImageResponse {
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
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
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
    ),
    { ...size },
  );
}
