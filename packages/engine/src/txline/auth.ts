import { fetch } from "undici";
import { z } from "zod";

const JwtResp = z.object({ token: z.string().min(1) });

export interface TxLineAuthOptions {
  baseUrl: string;
}

/**
 * Obtain a 30-day guest JWT. Unauthenticated — always succeeds unless server error.
 * Reference: POST /auth/guest/start
 */
export async function fetchGuestJwt(opts: TxLineAuthOptions): Promise<string> {
  const res = await fetch(`${opts.baseUrl}/auth/guest/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(`guest JWT failed: HTTP ${res.status} ${await res.text()}`);
  }
  const body = JwtResp.parse(await res.json());
  return body.token;
}

/**
 * Activate a subscription after an on-chain subscribe tx has been confirmed.
 * The API returns the long-lived API token as PLAIN TEXT (not JSON).
 * Message format per docs: `${txSig}:${selectedLeagues.join(",")}:${jwt}`
 * The walletSignature must be a Base64-encoded detached signature of that message.
 * Reference: POST /api/token/activate
 */
export interface ActivateInput {
  baseUrl: string;
  jwt: string;
  txSig: string;
  walletSignatureBase64: string;
  leagues?: number[];
}

export async function activateApiToken(input: ActivateInput): Promise<string> {
  const res = await fetch(`${input.baseUrl}/api/token/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      txSig: input.txSig,
      walletSignature: input.walletSignatureBase64,
      ...(input.leagues ? { leagues: input.leagues } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(
      `activation failed: HTTP ${res.status} ${await res.text()}`,
    );
  }
  const text = (await res.text()).trim();
  if (!text) throw new Error("activation returned empty token");
  return text;
}
