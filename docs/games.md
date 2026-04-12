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

## Shared Deck (`src/games/Deck.js`)

Card games use a shared deck module rather than defining cards inline.

- **`CARDS`** — exported object of all 52 cards plus a `back` card, each with `{ code, value, suit }`. `code` is the Discord emoji string. Used by templates for card display.
- **`Deck` class** — per-game instance; call `shuffle()` to build and Fisher-Yates shuffle the 52-card array, then `draw()` to pop cards one at a time.

```javascript
import { CARDS, Deck } from './Deck.js';

const deck = new Deck();
deck.shuffle();
const card = deck.draw(); // { code, value, suit }
```

`Blackjack` and `RideTheBus` both use this module. Any future card game should do the same.

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
- **Deck**: uses shared `Deck` class from `Deck.js`
- **Item Support**:
  - X-Ray Vision (`xrv`): See dealer's hole card
  - Ace.exe (`ace`): First card guaranteed ace

### Mines (`src/games/Mines.js`)
- **Setup**: 4x5 grid, player selects 1-10 mines
- **Mechanics**: Reveal safe tiles, multiplier increases per reveal
- **Payout**: Cash out at any time for `bet * current_multiplier`
- **Risk**: Hit a mine = lose bet

### Ride the Bus (`src/games/RideTheBus.js`)
- **Deck**: shared `Deck` class from `Deck.js`; card ranks A=1, 2–10 face value, J=11, Q=12, K=13
- **Interaction**: four sequential rounds, each with a 30s timeout
- **Tie rule**: ties are a loss (rank ties in Higher/Lower; boundary matches in Inside/Outside)
- **UI**: single message updated in place throughout; buttons disabled on game over (same pattern as Mines)
- **Flip animation**: 600ms delay between guess and card reveal

| Round | Question | Buttons | Cash-out |
|-------|----------|---------|---------|
| 1 | Red or Black? | `[Red]` `[Black]` | Not available |
| 2 | Higher or Lower? | `[Higher]` `[Lower]` | 2x via section button |
| 3 | Inside or Outside? | `[Inside]` `[Outside]` | 3x via section button |
| 4 | Guess the suit! | `[♣]` `[♦]` `[♥]` `[♠]` | 4x via section button |

- **Payouts**: 2x / 3x / 4x cash-out at rounds 2–4; 20x for winning round 4
- **Loss**: bet lost on wrong guess at any round
- **Timeout**: bet returned

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
2. If it's a card game, import `Deck` (and `CARDS` if templates need card display) from `./Deck.js`
3. Implement `async play(user, message, bet_amount)` returning result object
4. Register in `game_manager.registerGames()`
5. Add message templates in `MessageTemplates`
6. Initialize in `game_stats` table (see `db_manager.init()`)

## Timeouts
All interactive games use Discord's component collector with 30s timeout. On timeout:
- Game calls `handleTimeout()` which clears active game
- Returns `{result: 'timeout', payout: 0}`
- Bet is returned (no loss)
