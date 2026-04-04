# Leveling System

## Overview
Users earn XP by gambling. XP leads to levels (max 100), which unlock crates and increase passive carrot earnings.

## XP Calculation (`src/user/xp_manager.js`)

XP earned per game uses a gaussian risk-scoring formula:

```javascript
// Risk score: optimal at 50% of balance bet, falls off via gaussian
const risk = Math.min(1, bet_amount / user.balance);
const risk_score = Math.exp(-((risk - MU) ** 2) / (2 * SIGMA ** 2));

// Magnitude: logarithmic scaling with falloff for huge bets
const magnitude = Math.pow(Math.log10(bet_amount / BASE_BET + 1), 0.8);

// Combined weighted score
const combined = XP_A * risk_score + (1 - XP_A) * magnitude;

// Final XP with win/loss multiplier
const raw_xp = BASE_XP * (1 + combined * SCALE_MULTIPLIER);
const xp = raw_xp * (won ? WIN_MULTIPLIER : LOSS_MULTIPLIER);
```

### Config Parameters (`config.LEVELING`)
| Parameter | Default | Purpose |
|-----------|---------|---------|
| MU | 0.5 | Optimal bet ratio (bet/balance) |
| SIGMA | 0.1 | Gaussian falloff width |
| XP_A | 0.75 | Weight for risk vs magnitude |
| BASE_XP | 30 | Base XP per game |
| BASE_BET | 1000 | Reference bet for magnitude calc |
| WIN_MULTIPLIER | 1.05 | XP bonus for wins |
| LOSS_MULTIPLIER | 0.95 | XP penalty for losses |

### Soft Cap
XP per game is capped at 25% of required XP for current level. Overflow beyond cap is reduced to 25%.

## Level Requirements

```javascript
requiredXP = Math.floor(BASE_REQ_XP * level * (1 + level * 0.002))
// BASE_REQ_XP = 100
```

| Level | Required XP |
|-------|-------------|
| 1 | 100 |
| 10 | 1,020 |
| 25 | 2,625 |
| 50 | 5,500 |
| 75 | 8,625 |
| 100 | 12,000 |

## Level-Up Rewards

Each level grants:
1. **Carrots**: `level * 1000`
2. **Crates**: Quantity and tier scale with level
3. **Passive Bonus**: +10% to `passive_multiplier`

### Crate Unlocks
| Level | Unlocked Crate |
|-------|---------------|
| 1 | Copium Crate (c1) |
| 10 | Hopium Crate (c2) |
| 25 | Delusion Crate (c3) |
| 50 | Prophecy Crate (c4) |
| 75 | Ascension Crate (c5) |

### Crate Quantity by Level
| Level Range | Crates Awarded |
|-------------|---------------|
| 1-9 | 1 |
| 10-19 | 2 |
| 20-29 | 3 |
| ... | ... |
| 90-100 | 10 |

### Crate Distribution Ratios
Higher levels receive better crate tiers. See `xp_manager.getCrateRatiosForLevel()` for exact distributions.

## Database

### `user_progression` Table
| Column | Type | Purpose |
|--------|------|---------|
| xp | INTEGER | Current XP toward next level |
| level | INTEGER | Current level (1-100) |
| streak | INTEGER | Reserved for future use |
| passive_multiplier | INTEGER | % bonus to passive earnings |

## Level Colors (UI)
Levels are color-coded by tier in the UI:
- 1-16: Common (gray)
- 17-33: Uncommon (sky blue)
- 34-50: Rare (blue)
- 51-66: Epic (purple)
- 67-83: Legendary (gold)
- 84-100: Mythic (red)
