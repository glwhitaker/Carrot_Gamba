# UI System

## Overview
All bot responses use Discord's Components V2 API via `MessageTemplates` class (`src/utils/message_templates.js`).

## Message Pattern

```javascript
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from '../utils/message_templates.js';

message.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [MessageTemplates.someMessage(...)],
    files: [{ attachment: 'src/img/icon.png', name: 'icon.png' }]  // optional
});
```

## Color Palette

```javascript
const COLORS = {
    PRIMARY: 0x90D5FF,   // Default/info blue
    SUCCESS: 0x57F287,   // Win/success green
    ERROR: 0xF04747,     // Loss/error red
    INFO: 0x4F545C,      // Neutral gray
    WARNING: 0xFAA61A,   // Cooldown/warning orange
    GOLD: 0xFFB636       // Game in-progress gold
};
```

## Rarity Colors (Level/Crate Tiers)

| Tier | Hex | ANSI Code |
|------|-----|-----------|
| Common | 0xAAAAAA | `\u001b[0;30m` |
| Uncommon | 0x87CEEB | `\u001b[0;36m` |
| Rare | 0x6495ED | `\u001b[0;34m` |
| Epic | 0xDA70D6 | `\u001b[0;35m` |
| Legendary | 0xFFD700 | `\u001b[0;33m` |
| Mythic | 0xFF6B6B | `\u001b[0;31m` |

## Component Builders Used

- `ContainerBuilder` - Root container with accent color
- `TextDisplayBuilder` - Text content blocks
- `SectionBuilder` - Text with thumbnail/button accessory
- `SeparatorBuilder` - Spacing/dividers
- `ThumbnailBuilder` - Image thumbnails
- `MediaGalleryBuilder` - Larger images (crate animations)
- `ActionRowBuilder` - Button/select menu rows
- `ButtonBuilder` - Interactive buttons
- `StringSelectMenuBuilder` - Dropdown menus

## Standard Footer

All messages include:
```javascript
static getStandardFooter() {
    return {
        content: '-# [Carrot Gamba](link) | Use ^help for commands',
    };
}
```

## Message Templates Reference

### Economy
| Template | Purpose |
|----------|---------|
| `balanceMessage(username, balance)` | `^balance` response |
| `dailyRewardMessage(username, amount)` | Daily claim success |
| `dailyCooldownMessage(hours, minutes)` | Daily on cooldown |
| `weeklyRewardMessage(username, amount)` | Weekly claim success |
| `weeklyCooldownMessage(days, hours, minutes)` | Weekly on cooldown |

### Games
| Template | Purpose |
|----------|---------|
| `coinTossMessage(user, amount, frame)` | Coin flip animation |
| `coinTossResultMessage(user, bet, result)` | Coin flip result |
| `numberGuessMessage(user, bet, min, max, hints, disabled)` | Number buttons |
| `numberGuessResultMessage(user, bet, min, max, result)` | Number result |
| `blackjackMessage(user, player, dealer, bet, cards, pVal, dVal, hide)` | Blackjack game |
| `blackjackResultMessage(user, player, dealer, bet, pVal, dVal, result)` | Blackjack result |
| `selectMinesMessage(user, bet)` | Mine count selection |
| `minesGameMessage(user, bet, cells, mult, cashed)` | Mines grid |

### Results
| Template | Purpose |
|----------|---------|
| `appendGameResult(msg, game, bet, result, base, payout, mods)` | Adds payout breakdown to game message |
| `levelUpMessage(user, username, rewards)` | Level up notification |

### Items
| Template | Purpose |
|----------|---------|
| `inventoryMessage(user, items, active)` | `^inventory` response |
| `itemActivatedMessage(user, item_key)` | Item activation confirmation |
| `itemUsedMessage(user, item_key)` | Item consumption notification |
| `crateMessage(user, crate)` | Crate opening animation |
| `crateResultMessage(user, crate, items)` | Crate contents |

### Utility
| Template | Purpose |
|----------|---------|
| `errorMessage(message)` | Error display |
| `successMessage(title, message)` | Generic success |
| `helpMessage(selection, info)` | Help with category dropdown |
| `leaderboardMessage(boards, selection)` | Leaderboard with type dropdown |
| `userStatsMessage(user, stats)` | `^stats me` response |
| `userGameStatsMessage(user, game, userStats, globalStats)` | `^stats games <game>` response |

## ANSI Formatting

Used for colored text in code blocks:
```javascript
// Color text by level
static colorLevelText(text, level) {
    const color = colors[Math.floor((level - 1) / (100 / colors.length))];
    return color + text + '\u001b[0m';
}

// Usage in template
`\`\`\`ansi\n${coloredText}\`\`\``
```

## Helper Methods

- `formatNumber(n)` - Adds thousand separators (1000 → 1,000)
- `getLevelColor(level)` - Returns hex color for level
- `getCrateColor(key)` - Returns hex color for crate tier
- `padEndAnsi/padStartAnsi/padMidAnsi` - ANSI-aware string padding
- `visibleLength(str)` - String length excluding ANSI codes
- `getActiveItemsHeader(items)` - Item icon header row
- `userExperienceBar(user)` - XP progress bar

## Image Assets (`src/img/`)

| File | Usage |
|------|-------|
| bank.png | Balance messages |
| clock.png | Cooldown messages |
| gift.png | Reward messages |
| die.png | Game-related |
| c1.gif - c5.gif | Crate opening animations |
| c1_5.png - c5_5.png | Crate result images |
| empty.png | Placeholder |
