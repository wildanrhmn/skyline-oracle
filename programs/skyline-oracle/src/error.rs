use anchor_lang::prelude::*;

#[error_code]
pub enum SkylineError {
    #[msg("Only the registered publisher can publish updates")]
    Unauthorized,
    #[msg("Probability basis-points must sum to 10000 within tolerance")]
    InvalidProbabilitySum,
    #[msg("Individual probability exceeds 10000 bps")]
    InvalidProbabilityValue,
    #[msg("Confidence half-width exceeds 10000 bps")]
    InvalidConfidenceValue,
    #[msg("String length exceeds MAX_NAME_LEN bytes")]
    NameTooLong,
    #[msg("Kickoff timestamp must be in the future at market init")]
    KickoffInPast,
    #[msg("Market cannot be closed before its fixture kicks off")]
    ClosedTooEarly,
    #[msg("Publisher name cannot be empty")]
    NameEmpty,
}
