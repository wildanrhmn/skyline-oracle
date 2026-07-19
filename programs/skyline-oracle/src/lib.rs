//! Skyline Oracle — on-chain fair-value probability publisher for sports outcomes.
//! "Pyth for sports": consumes TxLINE consensus + proof references, exposes them
//! as read-only PDAs any Solana program can deserialize.

use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use error::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6");

#[program]
pub mod skyline_oracle {
    use super::*;

    /// One-time registration of the publisher (the fair-value engine wallet).
    /// The publisher is the only signer permitted to publish updates.
    pub fn initialize_publisher(
        ctx: Context<InitializePublisher>,
        name: String,
    ) -> Result<()> {
        instructions::initialize_publisher::handle_initialize_publisher(ctx, name)
    }

    /// Create a market account for a specific fixture. Idempotent per market_id.
    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        market_id: [u8; 32],
        fixture_id: u64,
        home: String,
        away: String,
        kickoff_ts: i64,
    ) -> Result<()> {
        instructions::initialize_market::handle_initialize_market(
            ctx, market_id, fixture_id, home, away, kickoff_ts,
        )
    }

    /// Publish a new fair-value snapshot for a market. Probabilities in basis
    /// points (1 bps = 0.01%; 10000 bps = 100%). Sum must be within tolerance
    /// of 10000. `txline_proof_ref` is the hash of the underlying TxLINE
    /// validation proof so consumers can independently verify provenance.
    pub fn publish_update(
        ctx: Context<PublishUpdate>,
        probabilities: [u16; 3],
        conf_half_widths: [u16; 3],
        txline_proof_ref: [u8; 32],
    ) -> Result<()> {
        instructions::publish_update::handle_publish_update(
            ctx,
            probabilities,
            conf_half_widths,
            txline_proof_ref,
        )
    }

    /// Close a market after its fixture is settled, reclaiming rent.
    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        instructions::close_market::handle_close_market(ctx)
    }
}
