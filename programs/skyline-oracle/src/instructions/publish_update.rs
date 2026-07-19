use anchor_lang::prelude::*;

use crate::constants::{
    BPS_ONE, MARKET_SEED, PROB_SUM_TOLERANCE_BPS, PUBLISHER_SEED,
};
use crate::error::SkylineError;
use crate::events::FairValueUpdated;
use crate::state::{FairValueUpdate, MarketAccount, PublisherRegistry};

#[derive(Accounts)]
pub struct PublishUpdate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [PUBLISHER_SEED],
        bump = publisher.bump,
        has_one = authority @ SkylineError::Unauthorized,
    )]
    pub publisher: Account<'info, PublisherRegistry>,

    #[account(
        mut,
        seeds = [MARKET_SEED, &market.market_id],
        bump = market.bump,
    )]
    pub market: Account<'info, MarketAccount>,
}

pub fn handle_publish_update(
    ctx: Context<PublishUpdate>,
    probabilities: [u16; 3],
    conf_half_widths: [u16; 3],
    txline_proof_ref: [u8; 32],
) -> Result<()> {
    for p in probabilities.iter() {
        require!((*p as u32) <= BPS_ONE, SkylineError::InvalidProbabilityValue);
    }
    for c in conf_half_widths.iter() {
        require!((*c as u32) <= BPS_ONE, SkylineError::InvalidConfidenceValue);
    }

    let sum: u32 = probabilities.iter().map(|p| *p as u32).sum();
    let diff = if sum > BPS_ONE { sum - BPS_ONE } else { BPS_ONE - sum };
    require!(
        diff <= PROB_SUM_TOLERANCE_BPS,
        SkylineError::InvalidProbabilitySum
    );

    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;
    market.current = FairValueUpdate {
        home_prob_bps: probabilities[0],
        draw_prob_bps: probabilities[1],
        away_prob_bps: probabilities[2],
        home_conf_bps: conf_half_widths[0],
        draw_conf_bps: conf_half_widths[1],
        away_conf_bps: conf_half_widths[2],
        txline_proof_ref,
        published_at: now,
    };
    market.last_updated_ts = now;
    market.update_count = market.update_count.saturating_add(1);

    let publisher = &mut ctx.accounts.publisher;
    publisher.published_count = publisher.published_count.saturating_add(1);

    emit!(FairValueUpdated {
        market_id: market.market_id,
        fixture_id: market.fixture_id,
        home_prob_bps: probabilities[0],
        draw_prob_bps: probabilities[1],
        away_prob_bps: probabilities[2],
        published_at: now,
        sequence: market.update_count,
    });
    Ok(())
}
