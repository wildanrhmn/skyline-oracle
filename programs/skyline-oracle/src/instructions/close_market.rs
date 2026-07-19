use anchor_lang::prelude::*;

use crate::constants::{MARKET_SEED, PUBLISHER_SEED};
use crate::error::SkylineError;
use crate::events::MarketClosed;
use crate::state::{MarketAccount, PublisherRegistry};

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [PUBLISHER_SEED],
        bump = publisher.bump,
        has_one = authority @ SkylineError::Unauthorized,
    )]
    pub publisher: Account<'info, PublisherRegistry>,

    #[account(
        mut,
        close = authority,
        seeds = [MARKET_SEED, &market.market_id],
        bump = market.bump,
    )]
    pub market: Account<'info, MarketAccount>,
}

pub fn handle_close_market(ctx: Context<CloseMarket>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(now >= ctx.accounts.market.kickoff_ts, SkylineError::ClosedTooEarly);

    emit!(MarketClosed {
        market_id: ctx.accounts.market.market_id,
        fixture_id: ctx.accounts.market.fixture_id,
        total_updates: ctx.accounts.market.update_count,
    });
    Ok(())
}
