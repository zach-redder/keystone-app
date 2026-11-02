// Off until the launch values below are filled in. Turning HARD_PAYWALL_ENABLED on without a
// cutoff date paywalls every existing free account, not just new sign-ups.
export const HARD_PAYWALL_ENABLED = false;

// ISO timestamp. Free accounts created before this keep their current free access.
export const HARD_PAYWALL_GRANDFATHER_BEFORE: string | null = null;

// Where the "not ready yet" screen sends people. Hidden while null.
export const COMMUNITY_URL: string | null = null;
