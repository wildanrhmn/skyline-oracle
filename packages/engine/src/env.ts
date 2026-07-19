import { config } from "dotenv";
import { z } from "zod";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const EnvSchema = z.object({
  TXLINE_BASE_URL: z.string().url().default("https://txline.txodds.com"),
  TXLINE_DEV_BASE_URL: z.string().url().default("http://txline-dev.txodds.com"),
  TXLINE_API_TOKEN: z.string().optional(),
  TXLINE_JWT: z.string().optional(),

  JUPITER_API_BASE_URL: z.string().url().default("https://api.jup.ag/prediction/v1"),
  JUPITER_API_KEY: z.string().optional(),

  SOLANA_CLUSTER: z.enum(["devnet", "mainnet-beta", "localnet"]).default("devnet"),
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  ANCHOR_WALLET: z.string().default(`${process.env.HOME}/.config/solana/id.json`),

  SKYLINE_ORACLE_PROGRAM_ID: z.string().optional(),

  TRADER_BANKROLL_USDC: z.coerce.number().default(100),
  TRADER_MAX_PER_MATCH_PCT: z.coerce.number().default(5),
  TRADER_KELLY_FRACTION: z.coerce.number().default(0.25),
  TRADER_EDGE_THRESHOLD_PCT: z.coerce.number().default(3),
  TRADER_DRAWDOWN_HALT_PCT: z.coerce.number().default(10),
});

export const env = EnvSchema.parse(process.env);
