const config = 
{
    "COMMAND_PREFIX": "^",
    "STARTING_BALANCE": 1000,
    "DAILY_COOLDOWN_MS": 24 * 60 * 60 * 1000,
    "DAILY_AMOUNT": 1000,
    "WEEKLY_COOLDOWN_MS": 7 * 24 * 60 * 60 * 1000,
    "WEEKLY_AMOUNT": 10000,
    "MESSAGE":
    {
        "MIN_LENGTH": 5,
        "COOLDOWN_MS": 60000,
        "POINTS": 50
    },
    "VOICE":
    {
        "REWARD_INTERVAL_MS": 60000,
        "POINTS": 20
    },
    "LEADERBOARD":
    {
        "SIZE": 20
    },
    "LEVELING":
    {
        "WIN_MULTIPLIER": 1.05,
        "LOSS_MULTIPLIER": 0.95,
        "MU": 0.5,                      // optimal bet amount / balance ratio
        "SIGMA": 0.1,                   // forgiveness (falloff) around mu
        "XP_A": 0.75,                   // weight for risk vs magnitude (higher = more risk focused)
        "BASE_XP": 30,
        "BASE_BET": 1000,
        "SCALE_MULTIPLIER": 3.0,
        "SOFT_CAP_PERCENTAGE": 0.25,    // percentage of max level where soft cap starts
        "OVERFLOW_REDUCTION": 0.25,     // percentage of overflow XP retained after soft cap

        "BASE_REQ_XP": 100,
        "XP_EXPONENT": 1.05,
        "MAX_LEVEL": 100,
    },
    "ITEMS":
    {
        "BOXES": {
            "c1": {
                "key": "c1",
                "name": "Crate I",
                "price": 5000,
                "rolls": 1,
                "tier_weights": {
                    "1": 90,
                    "2": 10
                }
            },
            "c2": {
                "key": "c2",
                "name": "Crate II",
                "price": 10000,
                "rolls": 2,
                "tier_weights": {
                    "1": 60,
                    "2": 40
                }
            },
            "c3": {
                "key": "c3",
                "name": "Crate III",
                "price": 20000,
                "rolls": 3,
                "tier_weights": {
                    "1": 40,
                    "2": 35,
                    "3": 20,
                    "4": 5
                }
            },
            "c4": {
                "key": "c4",
                "name": "Crate IV",
                "price": 50000,
                "rolls": 4,
                "tier_weights": {
                    "1": 20,
                    "2": 35,
                    "3": 35,
                    "4": 10
                }
            },
            "c5": {
                "key": "c5",
                "name": "Crate V",
                "price": 100000,
                "rolls": 5,
                "tier_weights": {
                    "1": 10,
                    "2": 20,
                    "3": 40,
                    "4": 30
                }
            }
        },
        "TIERS": {
            "1": {
                "weight": 100,
                "items": {
                    "lc": 50,
                    "cs": 50
                }
            },
            "2": {
                "weight": 100,
                "items": {
                    "jj": 30,
                    "xrv": 40,
                    "no": 30
                }
            },
            "3": {
                "weight": 100,
                "items": {
                    "sc": 100
                }
            },
            "4": {
                "weight": 100,
                "items": {
                    "sc": 100
                }
            }
        }
    }
};

export default config;