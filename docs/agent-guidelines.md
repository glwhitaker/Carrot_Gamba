# Agent Guidelines

Guidelines for Claude Code when working on Carrot Gamba.

## Rules (Non-Negotiable)

These invariants must never be violated:

### 1. No Negative Balances
Users cannot have negative carrot balances. Always validate sufficient funds before any deduction:
```javascript
if (user.balance < amount) {
    return error("Insufficient balance");
}
```

### 2. All State Changes Through db_manager
Never modify user data directly in the database. All updates must go through `db_manager` methods:
- `updateUserBalance()` - balance changes
- `updateLastDailyClaim()` / `updateLastWeeklyClaim()` - cooldowns
- `updateUserLevel()` - XP and leveling
- `updateUserStats()` - player statistics

This ensures the cache stays in sync and the dirty flag is set for periodic DB writes.

### 3. Game Payouts Are Atomic
A game's payout must be applied exactly once, after the game fully completes:
```javascript
// CORRECT: Single update after game ends
game_manager.endGame(user_id, guild_id);
await db_manager.updateUserBalance(user_id, guild_id, final_result.payout);
await game.updateStats(user_id, guild_id, bet_amount, result, payout);

// WRONG: Multiple partial updates during game
// WRONG: Deducting bet at start, adding winnings at end separately
```

The bet is never deducted upfront. The final payout (positive for win, negative for loss) is applied once at game completion.

### 4. One Active Game Per User
Users cannot start a new game while one is in progress. Always check:
```javascript
if (game_manager.userInGame(user_id, guild_id)) {
    return error("You already have an active game");
}
```

## Project Conventions

### Code Style
- ES Modules (`import`/`export`), not CommonJS
- Allman brace style (opening brace on new line)
- Snake_case for variables and functions
- 4-space indentation
- No semicolons optional (project uses them)

### Module Singletons
Core managers are singletons via ES module caching - a module is evaluated once and the export is shared:
```javascript
class Manager {
    constructor() { /* init */ }
}

export const manager = new Manager();
```

All importers receive the same instance. No wrapper class needed.

### Discord.js v14 Components V2
Always use Components V2 pattern:
```javascript
import { MessageFlags } from 'discord.js';

message.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [MessageTemplates.someMessage(...)]
});
```

## Common Tasks

### Adding a New Command

1. Create handler in `src/commands/new_command.js`:
```javascript
import { db_manager } from '../db/db_manager.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleNewCommand(args, message, usage) {
    const user_id = message.author.id;
    const guild_id = message.guild.id;

    const user = await db_manager.getUser(user_id, guild_id);
    if (!user) {
        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
        });
    }

    // Command logic here
}
```

2. Register in `src/commands/command_manager.js`:
```javascript
import { handleNewCommand } from './new_command.js';

// In constructor, add to appropriate category:
this.commands = {
    category_name: {
        new_command: {
            execute: handleNewCommand,
            description: 'What it does',
            usage: '^newcommand <args>',
            aliases: ['nc', 'alias']
        }
    }
}
```

### Adding a New Game

1. Create `src/games/NewGame.js`:
```javascript
import { Game } from './Game.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class NewGame extends Game {
    constructor() {
        super('newgame');  // Name used in ^gamba newgame
        this.min_bet = 10;
    }

    async play(user, message, bet_amount) {
        // Game logic here
        // Must return: { result, payout, message, base_payout }
    }
}
```

2. Register in `src/games/game_manager.js`:
```javascript
import { NewGame } from './NewGame.js';

registerGames() {
    this.gameClasses.set('newgame', NewGame);
}
```

3. Initialize stats in `src/db/db_manager.js`:
```javascript
await this.db.exec(`
    INSERT OR IGNORE INTO game_stats (game_name) VALUES
    ('newgame')
`);
```

4. Add templates in `MessageTemplates` as needed.

### Adding a New Item

1. Add definition in `src/items/item_manager.js`:
```javascript
this.items = {
    "key": {
        "key": "key",
        "name": "Display Name",
        "desc": "Effect description",
        "icon": "emoji",
        "price": 5000,
        "max_uses": 1,
        "tier": 2
    }
}
```

2. Add to tier pool in `config.ITEMS.TIERS`.

3. Implement effect in `src/commands/gamba.js:applyItemEffects()` or in specific game class.

### Modifying Database Schema

1. Add migration in `db_manager.init()` within transaction
2. Update `getUser()` to include new fields in cache
3. Add update methods as needed
4. Test with fresh DB and existing DB

## Testing

No automated tests exist. Manual testing approach:
1. Run bot locally with test Discord server
2. Use `^enroll` to create test user
3. Test commands directly in Discord
4. Check console for errors

## Debugging

Console logging uses prefixes:
- `[System]` - Bot lifecycle
- `[Database]` - DB operations
- `[ActivityTracker]` - Voice/message tracking
- `[Error]` - Errors

## Important Gotchas

1. **User cache**: Always use `db_manager.getUser()`, never query DB directly for user data
2. **Dirty flag**: Set `user.is_dirty = true` after modifying cached user data
3. **Active games**: Check `game_manager.userInGame()` before starting new game
4. **Item consumption**: Items must be consumed even if effect doesn't apply (e.g., Jackpot Juice on loss)
5. **Components V2**: All messages MUST use `MessageFlags.IsComponentsV2`

## File Organization

```
src/
├── index.js              # Entry point, client setup
├── config.js             # All tunable values
├── commands/             # Command handlers
│   ├── command_manager.js
│   └── *.js
├── games/                # Game implementations
│   ├── Game.js           # Base class
│   ├── game_manager.js
│   └── *.js
├── db/
│   └── db_manager.js     # SQLite + cache layer
├── items/
│   └── item_manager.js   # Items and crates
├── user/
│   ├── activity_tracker.js
│   └── xp_manager.js
├── utils/
│   └── message_templates.js
└── img/                  # Static assets
```

## Environment

- Node.js with ES Modules
- SQLite database (`carrot_gamba_v3.db`)
- Requires `.env` with `DISCORD_BOT_TOKEN`
