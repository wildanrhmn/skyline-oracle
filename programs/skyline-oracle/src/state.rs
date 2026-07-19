use anchor_lang::prelude::*;

use crate::constants::MAX_NAME_LEN;

/// Registry of the trusted publisher for the Skyline Oracle instance.
/// Only this authority can call `publish_update`.
#[account]
#[derive(InitSpace)]
pub struct PublisherRegistry {
    pub authority: Pubkey,
    #[max_len(MAX_NAME_LEN)]
    pub name: String,
    pub published_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

/// A sports market with the latest published fair-value.
/// PDA seeds: [b"market", market_id (32 bytes)].
#[account]
#[derive(InitSpace)]
pub struct MarketAccount {
    pub market_id: [u8; 32],
    pub fixture_id: u64,
    #[max_len(MAX_NAME_LEN)]
    pub home: String,
    #[max_len(MAX_NAME_LEN)]
    pub away: String,
    pub kickoff_ts: i64,
    pub current: FairValueUpdate,
    pub last_updated_ts: i64,
    pub update_count: u64,
    pub publisher: Pubkey,
    pub bump: u8,
}

/// Basis-point encoded fair-value snapshot. All values in bps (10000 = 100.00%).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq, InitSpace)]
pub struct FairValueUpdate {
    pub home_prob_bps: u16,
    pub draw_prob_bps: u16,
    pub away_prob_bps: u16,
    pub home_conf_bps: u16,
    pub draw_conf_bps: u16,
    pub away_conf_bps: u16,
    /// Hash reference to the TxLINE validation proof used for this update.
    /// Consumers can independently fetch the proof via TxLINE's API and verify
    /// it against TxLINE's on-chain program.
    pub txline_proof_ref: [u8; 32],
    pub published_at: i64,
}

impl Default for FairValueUpdate {
    fn default() -> Self {
        Self {
            home_prob_bps: 0,
            draw_prob_bps: 0,
            away_prob_bps: 0,
            home_conf_bps: 0,
            draw_conf_bps: 0,
            away_conf_bps: 0,
            txline_proof_ref: [0u8; 32],
            published_at: 0,
        }
    }
}
