export const REWARDS = {
    MESSAGE: {
        POINTS: 20,          // points per valid message
        MIN_LENGTH: 5,      // minimum message length
        COOLDOWN_MS: 60000,    // 1 minute cooldown between messages
        MAX_PER_HOUR: 500,  // 500 carrots per hour
    },
    VOICE: {
        POINTS_PER_MINUTE: 10,        // points per minute of voice
        MIN_USERS: 2,                // minimum users in voice channel
        AFK_THRESHOLD_MS: 300000,    // 5 minutes
        MAX_POINTS_PER_HOUR: 500     // 500 carrots per hour
    }
}