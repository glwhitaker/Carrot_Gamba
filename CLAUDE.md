# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Detailed system documentation is available in `/docs`:
- `docs/agent-guidelines.md` - **Read first.** Rules, conventions, and common tasks
- `docs/economy.md` - Balance, rewards, passive earnings
- `docs/leveling.md` - XP calculation, level progression, rewards
- `docs/items.md` - Items, crates, activation, consumption
- `docs/games.md` - Game system architecture, adding new games
- `docs/trendline.md` - Block-character area charts, adding new trendlines
- `docs/ui.md` - Message templates, Discord embeds
- `docs/ui-examples.md` - Message construction guide, worked examples, common mistakes

## Project Overview

Carrot Gamba is a Discord gambling bot built with discord.js v14. Users collect "carrots" (virtual currency) through passive activity (messages/voice chat) and gambling games, with an XP/leveling system and item crates.

## Commands

```bash
npm start          # Run the bot (executes src/index.js)
npm run start2     # Run alternate entry point (src2/index.js)
```

No test suite is configured. The bot requires a `.env` file with `DISCORD_BOT_TOKEN`.

## Architecture

### Entry Point & Event Flow
- `src/index.js` - Discord client setup, initializes managers, handles graceful shutdown
- Commands use prefix `^` (e.g., `^gamba blackjack 100`)
- Message events route through `command_manager.executeCommand()`

### Core Managers (all singletons)
- `db_manager` (`src/db/db_manager.js`) - SQLite via `sqlite3`/`sqlite` packages, maintains in-memory user cache with dirty flag, syncs to DB every 30 seconds
- `command_manager` (`src/commands/command_manager.js`) - Command registry with categories (economy, games, utility, items) and aliases
- `game_manager` (`src/games/game_manager.js`) - Game instance factory, tracks active games per user to prevent concurrent games
- `item_manager` (`src/items/item_manager.js`) - Item definitions, crate rolling logic with weighted tiers
- `xp_manager` (`src/user/xp_manager.js`) - XP calculation using gaussian risk scoring, level-up rewards
- `activity_tracker` (`src/user/activity_tracker.js`) - Passive carrot rewards for messages and voice activity

### Database Schema (SQLite: `carrot_gamba_v3.db`)
Tables: `users`, `user_progression`, `player_stats`, `game_stats`, `game_history`, `user_items`
- Primary key for user tables is compound: `(user_id, guild_id)`
- User data cached in memory with `is_dirty` flag for batch updates

### Game System
- Base class: `src/games/Game.js` - handles stats tracking and timeout
- Games: `Blackjack`, `CoinToss`, `NumberGuess`, `Mines`
- Games return result objects: `{result: 'win'|'loss'|'push'|'timeout', payout, message, base_payout}`
- Items can modify game behavior (e.g., `xrv` reveals dealer card, `ace` guarantees ace draw)

### Item/Crate System
- Crates defined in `src/config.js` under `ITEMS.BOXES` with tier weights
- Items defined in `item_manager.items` with per-use tracking
- Crates unlock at specific levels (c1=1, c2=10, c3=25, c4=50, c5=75)

### Configuration
- `src/config.js` - All tunable values: command prefix, cooldowns, reward amounts, leveling parameters, item/crate definitions

### Message Templates
- `src/utils/message_templates.js` - Discord embed builders for consistent UI
