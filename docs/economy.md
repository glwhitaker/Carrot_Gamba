# Economy System

## Overview
The economy uses "carrots" (🥕) as virtual currency. Users earn carrots through passive activity, timed rewards, and gambling.

## Currency Sources

### Passive Earnings (`src/user/activity_tracker.js`)
- **Messages**: 50 carrots per qualifying message (min 5 chars, 60s cooldown)
- **Voice Chat**: 20 carrots per minute while unmuted/undeafened
- Both scale with `passive_multiplier` from leveling: `base * (1 + passive_multiplier / 100)`

### Timed Rewards
- **Daily** (`^daily`): 1,000 carrots, 24h cooldown
- **Weekly** (`^weekly`): 10,000 carrots, 7-day cooldown
- Both rewards also scale with `passive_multiplier`

### Gambling
- Net gains/losses from games modify balance directly
- Item effects can modify final payouts (see items.md)

## User Balance Management

### Cache Layer
User data lives in `db_manager.user_cache` (Map keyed by `${user_id}-${guild_id}`).

```javascript
// Balance modification pattern
await db_manager.updateUserBalance(user_id, guild_id, amount);
// Positive amount = add, negative = subtract
```

### Dirty Flag Pattern
- `user.is_dirty = true` marks pending DB write
- `db_manager.updateAllUsers()` runs every 30 seconds to sync dirty users
- Called on shutdown to prevent data loss

## Database Tables

### `users` Table
| Column | Type | Purpose |
|--------|------|---------|
| user_id | TEXT | Discord user ID |
| guild_id | TEXT | Discord guild ID |
| balance | INTEGER | Current carrot balance |
| last_daily_claim | DATETIME | Cooldown tracking |
| last_weekly_claim | DATETIME | Cooldown tracking |
| last_message_date | DATETIME | Message reward cooldown |

### `player_stats` Table
Tracks `highest_balance` for all-time leaderboard.

## Starting Balance
New users receive 1,000 carrots on enrollment (`config.STARTING_BALANCE`).

## Donations (`^donate @user amount`)
Direct user-to-user transfers. Validates sender has sufficient balance before transfer.

## Leaderboards
- **Current**: Sorted by `users.balance`
- **All-Time**: Sorted by `player_stats.highest_balance`
- Size limited by `config.LEADERBOARD.SIZE` (default 20)
