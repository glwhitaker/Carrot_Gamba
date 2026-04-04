# Games System

## Architecture

### Base Class (`src/games/Game.js`)
All games extend `Game` base class:

```javascript
class Game {
    constructor(name) {
        this.name = name;
        this.min_bet = 10;
    }

    async updateStats(user_id, guild_id, bet_amount, result, payout) {
        // Records to game_history, game_stats, player_stats
    }

    async handleTimeout(user, game_message) {
        // Returns timeout result, ends game in manager
    }
}
```

### Game Manager (`src/games/game_manager.js`)
Singleton that:
- Registers game classes by name
- Factory method `getGame(name)` returns new instance
- Tracks active games per user to prevent concurrent games

```javascript
// Check before starting game
if (game_manager.userInGame(user_id, guild_id)) {
    return error("You already have an active game");
}

game_manager.startGame(user_id, guild_id, game_instance);
// ... play game ...
game_manager.endGame(user_id, guild_id);
```

### Result Object
All games return standardized result:

```javascript
{
    result: 'win' | 'loss' | 'push' | 'timeout',
    payout: Number,      // Positive for win, negative for loss
    message: Message,    // Discord message to edit with results
    base_payout: Number  // Pre-item-effect payout for display
}
```

## Available Games

### CoinToss (`src/games/CoinToss.js`)
- **Odds**: 50/50
- **Payout**: 1:1 (bet amount)
- **Interaction**: Automatic flip with animation frames

### NumberGuess (`src/games/NumberGuess.js`)
- **Odds**: 1 in 10 (numbers 1-10)
- **Payout**: 10x bet
- **Interaction**: Button grid (1-10)
- **Item Support**: Number Oracle (`no`) highlights 5 numbers including winner

### Blackjack (`src/games/Blackjack.js`)
- **Rules**: Standard blackjack, dealer stands on 17
- **Payout**: 1:1 normal win, 1.5x for natural blackjack
- **Interaction**: Hit/Stand buttons, 30s timeout
- **Item Support**:
  - X-Ray Vision (`xrv`): See dealer's hole card
  - Ace.exe (`ace`): First card guaranteed ace

### Mines (`src/games/Mines.js`)
- **Setup**: 4x5 grid, player selects 1-10 mines
- **Mechanics**: Reveal safe tiles, multiplier increases per reveal
- **Payout**: Cash out at any time for `bet * current_multiplier`
- **Risk**: Hit a mine = lose bet

## Game Flow (`src/commands/gamba.js`)

```javascript
// 1. Validate user enrolled, bet amount, not already in game
// 2. Start game tracking
game_manager.startGame(user_id, guild_id, game);

// 3. Play game (handles Discord interactions)
const result = await game.play(user, message, bet_amount);

// 4. Apply item effects (modifies payout)
const final_result = await applyItemEffects(user, message, bet_amount, result, game, result_array);

// 5. Update message with final payout calculation
MessageTemplates.appendGameResult(...)

// 6. End game tracking
game_manager.endGame(user_id, guild_id);

// 7. Update balance, stats, XP
await db_manager.updateUserBalance(user_id, guild_id, final_result.payout);
await game.updateStats(user_id, guild_id, bet_amount, final_result.result, final_result.payout);
await db_manager.updateUserLevel(user_id, guild_id, xp);
```

## Database Tables

### `game_history`
Per-game record for user analytics:
- game_name, user_id, guild_id, bet_amount, result, payout, timestamp

### `game_stats`
Aggregate stats per game type:
- total_games_played, total_games_won, total_games_lost
- total_money_wagered, total_money_won, total_money_lost

## Adding a New Game

1. Create `src/games/NewGame.js` extending `Game`
2. Implement `async play(user, message, bet_amount)` returning result object
3. Register in `game_manager.registerGames()`
4. Add message templates in `MessageTemplates`
5. Initialize in `game_stats` table (see `db_manager.init()`)

## Timeouts
All interactive games use Discord's component collector with 30s timeout. On timeout:
- Game calls `handleTimeout()` which clears active game
- Returns `{result: 'timeout', payout: 0}`
- Bet is returned (no loss)
