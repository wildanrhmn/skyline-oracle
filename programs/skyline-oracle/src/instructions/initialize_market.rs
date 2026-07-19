use anchor_lang::prelude::*;

use crate::constants::{MARKET_SEED, MAX_NAME_LEN, PUBLISHER_SEED};
use crate::error::SkylineError;
use crate::events::MarketInitialized;
use crate::state::{FairValueUpdate, MarketAccount, PublisherRegistry};

#[derive(Accounts)]
#[instruction(market_id: [u8; 32])]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [PUBLISHER_SEED],
        bump = publisher.bump,
        has_one = authority @ SkylineError::Unauthorized,
    )]
    pub publisher: Account<'info, PublisherRegistry>,

    #[account(
        init,
        payer = authority,
        space = 8 + MarketAccount::INIT_SPACE,
        seeds = [MARKET_SEED, &market_id],
        bump,
    )]
    pub market: Account<'info, MarketAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_market(
    ctx: Context<InitializeMarket>,
    market_id: [u8; 32],
    fixture_id: u64,
    home: String,
    away: String,
    kickoff_ts: i64,
) -> Result<()> {
    require!(home.as_bytes().len() <= MAX_NAME_LEN, SkylineError::NameTooLong);
    require!(away.as_bytes().len() <= MAX_NAME_LEN, SkylineError::NameTooLong);

    let now = Clock::get()?.unix_timestamp;
    require!(kickoff_ts > now, SkylineError::KickoffInPast);

    let market = &mut ctx.accounts.market;
    market.market_id = market_id;
    market.fixture_id = fixture_id;
    market.home = home;
    market.away = away;
    market.kickoff_ts = kickoff_ts;
    market.current = FairValueUpdate::default();
    market.last_updated_ts = 0;
    market.update_count = 0;
    market.publisher = ctx.accounts.authority.key();
    market.bump = ctx.bumps.market;

    emit!(MarketInitialized {
        market_id,
        fixture_id,
        kickoff_ts,
    });
    Ok(())
}
