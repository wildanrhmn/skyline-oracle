// ElevenLabs voiceover generator — one mp3 per scene into public/voiceover.
// Usage: XI=<key> [VOICE=<id>] node generate-vo.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const XI = process.env.XI;
const VOICE = process.env.VOICE || "CwhRBWXzGAHq8TQ4Fs17"; // 'Roger'
const MODEL = "eleven_multilingual_v2";

if (!XI) {
  console.error("Set XI=<elevenlabs api key>");
  process.exit(1);
}

const LINES = {
  1: "Sports trading is a two-hundred billion dollar business. On-chain prediction markets are a twelve billion dollar market. Between them: a pricing gap. Nobody has bridged that gap on Solana. Until now.",
  2: "The problem. Sportsbooks have institutional-grade odds — cross-book consensus, ten millisecond ticks. On-chain markets have thin liquidity and slow price discovery. The gap between them is the arbitrage.",
  3: "This is Skyline. Three layers. A fair-value engine that ingests TxLINE's sharp consensus. A Solana Anchor program that publishes it on-chain. A trader that reads the oracle and executes autonomously.",
  4: "Every market publishes home, draw, and away probabilities in basis points, plus a reference hash to the TxLINE proof. Any Solana program can deserialize the account and consume the price. No permission. No rate limit. No middleman.",
  5: "The trader strips the vig using the Shin nineteen ninety three method, weights books by sharpness, sizes edges with fractional Kelly, and gates every intent through a portfolio risk manager. Simulation or live — one env flag.",
  6: "The oracle is deployed. France versus England, Spain versus Argentina — two markets, real fair-values from live TxLINE consensus, published on-chain. Verifiable on Solana Explorer, right now.",
  7: "Skyline. Sharp consensus, on-chain. Live at skyline dash fawn dot vercel dot app. Source at github dot com slash wildanrhmn slash skyline dash oracle.",
};

mkdirSync("public/voiceover", { recursive: true });

for (const [id, text] of Object.entries(LINES)) {
  process.stdout.write(`[${id}] ${text.slice(0, 60)}… `);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
    method: "POST",
    headers: {
      "xi-api-key": XI,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.25,
        use_speaker_boost: true,
      },
    }),
  });
  if (!r.ok) {
    console.error(`\n  failed HTTP ${r.status}: ${await r.text()}`);
    process.exit(1);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(`public/voiceover/${id}.mp3`, buf);
  console.log(`ok (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log("\n✓ 7 mp3(s) written to public/voiceover/");
