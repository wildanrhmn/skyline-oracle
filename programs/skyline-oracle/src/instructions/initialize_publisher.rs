use anchor_lang::prelude::*;

use crate::constants::{MAX_NAME_LEN, PUBLISHER_SEED};
use crate::error::SkylineError;
use crate::state::PublisherRegistry;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializePublisher<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PublisherRegistry::INIT_SPACE,
        seeds = [PUBLISHER_SEED],
        bump,
    )]
    pub publisher: Account<'info, PublisherRegistry>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_publisher(ctx: Context<InitializePublisher>, name: String) -> Result<()> {
    require!(!name.is_empty(), SkylineError::NameEmpty);
    require!(name.as_bytes().len() <= MAX_NAME_LEN, SkylineError::NameTooLong);

    let publisher = &mut ctx.accounts.publisher;
    publisher.authority = ctx.accounts.authority.key();
    publisher.name = name;
    publisher.published_count = 0;
    publisher.created_at = Clock::get()?.unix_timestamp;
    publisher.bump = ctx.bumps.publisher;
    Ok(())
}
