use anchor_lang::prelude::*;

#[event]
pub struct FairValueUpdated {
    pub market_id: [u8; 32],
    pub fixture_id: u64,
    pub home_prob_bps: u16,
    pub draw_prob_bps: u16,
    pub away_prob_bps: u16,
    pub published_at: i64,
    pub sequence: u64,
}

#[event]
pub struct MarketInitialized {
    pub market_id: [u8; 32],
    pub fixture_id: u64,
    pub kickoff_ts: i64,
}

#[event]
pub struct MarketClosed {
    pub market_id: [u8; 32],
    pub fixture_id: u64,
    pub total_updates: u64,
}
