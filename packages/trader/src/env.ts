import { config } from "dotenv";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const EnvSchema = z.object({
  JUPITER_API_BASE_URL: z
    .string()
    .url()
    .default("https://api.jup.ag/prediction/v1"),
  JUPITER_API_KEY: z.string().min(1),

  SOLANA_RPC_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
  ANCHOR_WALLET: z.string().default(`${process.env.HOME}/.config/solana/id.json`),

  ORACLE_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  SKYLINE_ORACLE_PROGRAM_ID: z.string().min(32),

  TRADER_MODE: z.enum(["sim", "real"]).default("sim"),
  TRADER_BANKROLL_USDC: z.coerce.number().default(20),
  TRADER_MAX_PER_MATCH_PCT: z.coerce.number().default(30),
  TRADER_KELLY_FRACTION: z.coerce.number().default(0.25),
  TRADER_EDGE_THRESHOLD_PCT: z.coerce.number().default(3),
  TRADER_MIN_ORDER_USD: z.coerce.number().default(5),
  TRADER_DRAWDOWN_HALT_PCT: z.coerce.number().default(10),
  TRADER_POLL_INTERVAL_MS: z.coerce.number().default(15_000),
});

export const env = EnvSchema.parse(process.env);
