const config = 
{
    "COMMAND_PREFIX": "!",
    "STARTING_BALANCE": 1000,
    "DAILY_COOLDOWN_MS": 24 * 60 * 60 * 1000,
    "DAILY_AMOUNT": 1000,
    "WEEKLY_COOLDOWN_MS": 7 * 24 * 60 * 60 * 1000,
    "WEEKLY_AMOUNT": 10000,
    "XP_A": 0.6,
    "BASE_XP": 20,
    "BASE_BET": 1000,
    "WIN_MULTIPLIER": 1.2,
    "LOSS_MULTIPLIER": 0.8,
    "BASE_REQ_XP": 100,
    "XP_EXPONENT": 1.2,
    "MAX_LEVEL": 100,
    "MESSAGE":
    {
        "MIN_LENGTH": 5,
        "COOLDOWN_MS": 5000,
        "POINTS": 20
    }
};

export default config;