#!/usr/bin/env tsx
/**
 * TxLINE free-tier activation for the World Cup hackathon.
 *
 * Runs the full end-to-end flow:
 *   1. Fetch a guest JWT from TxLINE.
 *   2. Load TxLINE's on-chain PricingMatrix; find a free-tier row (price = 0).
 *   3. Ensure the user's ATA for the TxLINE subscription-token mint exists
 *      (creating it if missing).
 *   4. Call `subscribe(service_level_id, weeks=1)` on TxLINE's devnet program.
 *   5. Sign `${txSig}:${leagues}:${jwt}` with the wallet keypair.
 *   6. POST /api/token/activate to receive a long-lived API token.
 *   7. Persist the token to ~/skyline/.env as TXLINE_API_TOKEN.
 *
 * Prereqs: devnet SOL in the wallet; TxLINE IDL at scripts/txline-idl/txoracle.json.
 * Cost: ~0.01 SOL for one-off account rents + tx fees.
 */

import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { fetch } from "undici";
import nacl from "tweetnacl";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const IDL_PATH = path.join(ROOT, "scripts/txline-idl/txoracle.json");
const WALLET_PATH =
  process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;

const TXLINE_DEVNET_PROGRAM_ID = new PublicKey(
  "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
);
const TXLINE_DEVNET_TOKEN_MINT = new PublicKey(
  "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
);
const TXLINE_DEVNET_API = "https://txline-dev.txodds.com";
const DEVNET_RPC = "https://api.devnet.solana.com";

const PRICING_MATRIX_SEED = Buffer.from("pricing_matrix");
const TOKEN_TREASURY_SEED = Buffer.from("token_treasury_v2");

function loadKeypair(p: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(p, "utf8"))));
}

async function fetchGuestJwt(): Promise<string> {
  const res = await fetch(`${TXLINE_DEVNET_API}/auth/guest/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`guest jwt HTTP ${res.status}`);
  const body = (await res.json()) as { token: string };
  return body.token;
}

function upsertEnv(key: string, value: string): void {
  let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  writeFileSync(ENV_PATH, content, { mode: 0o600 });
}

async function main(): Promise<void> {
  const wallet = loadKeypair(WALLET_PATH);
  console.log("→ Wallet:", wallet.publicKey.toBase58());

  const conn = new Connection(DEVNET_RPC, "confirmed");
  const solBalance = await conn.getBalance(wallet.publicKey);
  console.log(`→ SOL balance: ${(solBalance / 1e9).toFixed(4)} SOL`);
  if (solBalance < 0.05 * 1e9) {
    throw new Error("Need at least 0.05 SOL for subscription tx + rent");
  }

  console.log("→ Fetching guest JWT…");
  const jwt = await fetchGuestJwt();
  console.log("  jwt ok");

  const idl = JSON.parse(readFileSync(IDL_PATH, "utf8")) as anchor.Idl;
  const provider = new AnchorProvider(conn, new Wallet(wallet), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  // Override to force use of the correct program id even if IDL was stale.
  const idlWithAddress = { ...idl, address: TXLINE_DEVNET_PROGRAM_ID.toBase58() };
  const program = new Program(idlWithAddress, provider) as unknown as {
    account: {
      pricingMatrix: {
        fetch: (pubkey: PublicKey) => Promise<{
          admin: PublicKey;
          rows: Array<{
            rowId: number;
            pricePerWeekToken: BN;
            samplingIntervalSec: number;
            leagueBundleId: number;
            marketBundleId: number;
          }>;
        }>;
      };
    };
    methods: {
      subscribe: (serviceLevelId: number, weeks: number) => {
        accounts: (acc: Record<string, PublicKey>) => {
          signers: (s: Keypair[]) => { rpc: () => Promise<string> };
        };
      };
    };
    programId: PublicKey;
  };

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [PRICING_MATRIX_SEED],
    TXLINE_DEVNET_PROGRAM_ID,
  );
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [TOKEN_TREASURY_SEED],
    TXLINE_DEVNET_PROGRAM_ID,
  );
  console.log("→ pricing_matrix PDA:", pricingMatrixPda.toBase58());
  console.log("→ token_treasury PDA:", tokenTreasuryPda.toBase58());

  console.log("→ Loading pricing matrix…");
  const pm = await program.account.pricingMatrix.fetch(pricingMatrixPda);
  console.log(`  ${pm.rows.length} tiers loaded`);
  for (const row of pm.rows) {
    console.log(
      `    row_id=${row.rowId}  price/week=${row.pricePerWeekToken.toString()}  ` +
        `sampling=${row.samplingIntervalSec}s  leagueBundle=${row.leagueBundleId}  ` +
        `marketBundle=${row.marketBundleId}`,
    );
  }

  const freeRow = pm.rows.find((r) => r.pricePerWeekToken.isZero());
  if (!freeRow) {
    throw new Error(
      "No free-tier row (price_per_week_token == 0) found in TxLINE PricingMatrix",
    );
  }
  console.log(
    `→ Selected free-tier row_id=${freeRow.rowId} (leagueBundle=${freeRow.leagueBundleId})`,
  );

  const treasuryVaultAta = getAssociatedTokenAddressSync(
    TXLINE_DEVNET_TOKEN_MINT,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
  const userTokenAta = getAssociatedTokenAddressSync(
    TXLINE_DEVNET_TOKEN_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  console.log("→ user_token_account:", userTokenAta.toBase58());
  console.log("→ treasury vault:    ", treasuryVaultAta.toBase58());

  try {
    await getAccount(conn, userTokenAta, "confirmed", TOKEN_2022_PROGRAM_ID);
    console.log("  user ATA exists");
  } catch {
    console.log("  user ATA missing — creating…");
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAta,
        wallet.publicKey,
        TXLINE_DEVNET_TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    const sig = await provider.sendAndConfirm(tx, [wallet]);
    console.log("  ATA created, sig:", sig);
  }

  console.log("→ Calling subscribe()…");
  const subscribeSig = await program.methods
    .subscribe(freeRow.rowId, 4)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TXLINE_DEVNET_TOKEN_MINT,
      userTokenAccount: userTokenAta,
      tokenTreasuryVault: treasuryVaultAta,
      tokenTreasuryPda: tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([wallet])
    .rpc();
  console.log("  subscribe tx sig:", subscribeSig);

  // Standard-matrix subscription: `leagues` optional; message has empty middle field.
  const message = `${subscribeSig}::${jwt}`;
  const sig = nacl.sign.detached(new TextEncoder().encode(message), wallet.secretKey);
  const walletSignatureB64 = Buffer.from(sig).toString("base64");

  console.log("→ Activating API token…");
  console.log(`  message: ${subscribeSig}::<jwt>`);
  const activateRes = await fetch(`${TXLINE_DEVNET_API}/api/token/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      txSig: subscribeSig,
      walletSignature: walletSignatureB64,
    }),
  });
  if (!activateRes.ok) {
    throw new Error(`activate HTTP ${activateRes.status}: ${await activateRes.text()}`);
  }
  const leagues: number[] = [];
  const apiToken = (await activateRes.text()).trim();
  console.log(`  API token: ${apiToken.slice(0, 24)}…`);

  upsertEnv("TXLINE_API_TOKEN", apiToken);
  upsertEnv("TXLINE_JWT", jwt);
  upsertEnv("TXLINE_BASE_URL", TXLINE_DEVNET_API);
  console.log(`✓ Wrote token to ${ENV_PATH}`);
}

main().catch((err: unknown) => {
  console.error("✗ activation failed:", err);
  process.exit(1);
});
