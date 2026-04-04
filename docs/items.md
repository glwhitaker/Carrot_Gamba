# Items System

## Overview
Items provide gameplay modifiers. Users obtain items from crates (leveling rewards or future shop) and activate them before gambling.

## Item Manager (`src/items/item_manager.js`)

### Available Items

| Key | Name | Effect | Uses | Tier |
|-----|------|--------|------|------|
| `sc` | Second Chance Token | If you lose, replay the game. Wins on retry pay 50% | 1 | 3 |
| `lc` | Loss Cushion | Reduces loss by 50% | 1 | 1 |
| `jj` | Jackpot Juice | Doubles winnings | 1 | 2 |
| `cs` | Carrot Surge | +10% winnings per game | 5 | 1 |
| `no` | Number Oracle | Highlights 5 numbers in Number Guess (one is the winner) | 1 | 2 |
| `xrv` | X-Ray Vision | Reveals dealer's hidden card in Blackjack | 1 | 2 |
| `ace` | Ace.exe | Guarantees an ace on first draw in Blackjack | 1 | 3 |

### Item Activation Flow

1. User runs `^use <code>` (e.g., `^use jj`)
2. Item added to `item_manager.current_items_activated[guild-user]`
3. Item removed from DB inventory
4. On next game, effects applied in `gamba.js:applyItemEffects()`
5. Item consumed from active items after use

### Effect Application Order (`gamba.js:applyItemEffects`)
1. **Second Chance** (`sc`) - replays game on loss
2. **Loss Cushion** (`lc`) - halves loss
3. **Jackpot Juice** (`jj`) - doubles win
4. **Carrot Surge** (`cs`) - +10% win

Game-specific items (`no`, `xrv`, `ace`) are handled within respective game classes.

## Crates

### Crate Definitions (`config.ITEMS.BOXES`)

| Key | Name | Price | Rolls | Tier Weights |
|-----|------|-------|-------|--------------|
| `c1` | Copium Crate | 5,000 | 1 | T1:90%, T2:10% |
| `c2` | Hopium Crate | 10,000 | 2 | T1:60%, T2:40% |
| `c3` | Delusion Crate | 20,000 | 3 | T1:40%, T2:35%, T3:20%, T4:5% |
| `c4` | Prophecy Crate | 50,000 | 4 | T1:20%, T2:35%, T3:35%, T4:10% |
| `c5` | Ascension Crate | 100,000 | 5 | T1:10%, T2:20%, T3:40%, T4:30% |

### Tier Item Pools (`config.ITEMS.TIERS`)

| Tier | Items (weighted) |
|------|-----------------|
| 1 | `lc`:50, `cs`:50 |
| 2 | `jj`:30, `xrv`:40, `no`:30 |
| 3 | `sc`:30, `jj`:30, `ace`:30, `no`:10 |
| 4 | `sc`:100 |

### Rolling Algorithm (`item_manager.rollCrate`)
```javascript
for each roll in crate.rolls:
    tier = weightedRoll(crate.tier_weights)
    item = weightedRoll(tiers[tier].items)
    results.push(item)
```

## Database

### `user_items` Table
| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER | Auto-increment PK |
| key | TEXT | Item/crate code |
| user_id | TEXT | Owner |
| guild_id | TEXT | Guild context |
| uses_left | INTEGER | Remaining uses |
| created_on | DATETIME | FIFO ordering |

Items are removed FIFO (oldest first) when consumed.

## Commands

| Command | Description |
|---------|-------------|
| `^inventory` / `^inv` | View owned items and active items |
| `^use <code>` | Activate an item for next game |
| `^open <code>` | Open a crate (e.g., `^open c1`) |

## UI Integration
- Active items display as icon header row above game messages
- Inventory shows active items separately from stored items
- Crate opening has animated GIF followed by results
