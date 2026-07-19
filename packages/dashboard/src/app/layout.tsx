import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const OG_TITLE = "Skyline — Sharp-consensus sports oracle on Solana";
const OG_DESC =
  "A permissionless Anchor program on Solana devnet that publishes TxLINE-derived fair-value probabilities as PDAs any Solana program can consume.";

export const metadata: Metadata = {
  title: OG_TITLE,
  description: OG_DESC,
  metadataBase: new URL("https://skyline-fawn.vercel.app"),
  openGraph: {
    title: OG_TITLE,
    description: OG_DESC,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body>
        <Providers>
          <div className="bg-layer" />
          <div className="bg-grid" />
          <div className="bg-scan" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
