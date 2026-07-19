use anchor_lang::prelude::*;

#[constant]
pub const PUBLISHER_SEED: &[u8] = b"publisher";

#[constant]
pub const MARKET_SEED: &[u8] = b"market";

/// Probability basis-point representation: 10000 bps = 100.00%.
pub const BPS_ONE: u32 = 10_000;

/// Tolerance for the probability sum. Rounding across the 3 outcomes should
/// stay within ±5 bps of 10000 (0.05%). Anything larger indicates a math bug
/// in the fair-value engine.
pub const PROB_SUM_TOLERANCE_BPS: u32 = 5;

/// Cap on publisher/market name string lengths (byte length, not char count).
pub const MAX_NAME_LEN: usize = 64;
