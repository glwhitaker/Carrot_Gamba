# UI Examples & Message Construction Guide

## Overview
All bot messages are built using Discord's Components V2 API through the `MessageTemplates` class (`src/utils/message_templates.js`). This document covers the structural patterns, conventions, and worked examples an agent should follow when constructing or modifying messages.

---

## The Reply Pattern

Every command response follows this structure:

```javascript
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from '../utils/message_templates.js';

message.reply({
    flags: MessageFlags.IsComponentsV2,         // ALWAYS required
    components: [MessageTemplates.someMessage(...)],
    files: [{ attachment: 'src/img/icon.png', name: 'icon.png' }]  // only if message uses a thumbnail
});
```

**Rules:**
- `MessageFlags.IsComponentsV2` must always be present. Messages will fail silently without it.
- `components` is always an array containing a single `ContainerBuilder` returned by a template method.
- `files` is only needed when the container includes a `ThumbnailBuilder` or `MediaGalleryBuilder`. The `name` in the files array must match the filename used in the template (e.g. `attachment://icon.png`).

---

## Container Roots

There are two ways a container is created, depending on context:

### Non-game messages (economy, utility, errors)
Use `new ContainerBuilder()` directly:

```javascript
const container = new ContainerBuilder()
    .setAccentColor(COLORS.PRIMARY)
    ...
```

### Game messages
Always use `_gameContainer(color, user)`. This is a required internal helper — it creates the `ContainerBuilder`, sets the accent color, and conditionally prepends the active-items icon header if the user has items activated:

```javascript
const container = this._gameContainer(COLORS.GOLD, user)
    ...
```

Never use `new ContainerBuilder()` directly for a game message. The active items header will be missing.

---

## Finalization

Every message, without exception, ends with `_finalize(container)`:

```javascript
return this._finalize(container);
```

`_finalize` appends a trailing spacer and the standard footer (`-# [Carrot Gamba](...) | Use ^help for commands`). Never add the footer manually, and never return a container without calling `_finalize`.

---

## Color Selection

```javascript
const COLORS = {
    PRIMARY: 0x90D5FF,   // General info, balance, neutral responses
    SUCCESS: 0x57F287,   // Win, successful claim, item activated
    ERROR:   0xF04747,   // Loss, error, invalid input
    INFO:    0x4F545C,   // Stats, neutral data displays
    WARNING: 0xFAA61A,   // Cooldowns, caution states
    GOLD:    0xFFB636    // Game in progress
};
```

**When to use each:**
- Game **in progress** → `GOLD`
- Game **won** → `SUCCESS`
- Game **lost** → `ERROR`
- Game **push/timeout** → `WARNING`
- **Cooldown** messages → `WARNING`
- **Reward claimed** → `SUCCESS`
- **Balance/leaderboard/stats** → `PRIMARY` or `INFO`
- **Error** messages → `ERROR`

For level-up and crate messages, use `getLevelColor(level)` or `getCrateColor(crate_key)` instead of a `COLORS` constant.

---

## Heading Hierarchy & Text Conventions

Discord markdown inside `TextDisplayBuilder` follows a consistent hierarchy across all templates:

| Level | Markdown | Usage |
|-------|----------|-------|
| Primary title | `# Title` | Game name, page name (e.g. `# Blackjack`, `# Carrot Bank`) |
| Result title | `# You Win!` / `# You Lose!` | Replaces the primary title on result messages |
| Sub-header | `### Label` | Section labels (e.g. `### Dealer Hand (17)`) |
| Body / detail | `>>> content` | Indented body text, descriptions, account info |
| Footnote | `-# text` | Footer line, active item icons header |

Use `#` for the first `_text()` in a container. Do not use `##` as a primary title unless it's a sub-section within a larger message (e.g. `## Result:` in `appendGameResult`, `## Opening Crate...`).

---

## Internal Helpers Reference

These are static methods on `MessageTemplates` used internally to keep templates DRY. Use them rather than constructing equivalents inline.

### `_text(content)`
Returns a `TextDisplayBuilder`. Use for all text blocks.

```javascript
this._text('# Coin Toss')
this._text(`>>> **${user.username}** bets\n**${this.formatNumber(amount)}** 🥕`)
```

### `_spacer()`
Returns a `SeparatorBuilder` with no divider line. Used to add vertical breathing room between sections.

```javascript
.addSeparatorComponents(this._spacer())
```

### `_thumbnail(url)`
Returns a `ThumbnailBuilder`. Always uses `attachment://filename` URLs.

```javascript
this._thumbnail('attachment://icon.png')
```

### `_sectionWithThumbnail(headerText, bodyText, imageFile)`
Builds a `SectionBuilder` with two text blocks and a thumbnail accessory. Used in economy messages (balance, daily, weekly).

```javascript
this._sectionWithThumbnail(
    '# Carrot Bank',
    `>>> **Account Holder**\n\`${username}\``,
    'bank.png'
)
```

### `_betText(user, amount)`
Produces the standard bet line used in every game message. Always the second element after the title.

```javascript
this._text(`>>> **${user.username}** bets\n**${this.formatNumber(amount)}** 🥕`)
```

### `_gameContainer(color, user)`
Creates the root container for game messages. Handles active items injection. See [Container Roots](#container-roots).

### `_finalize(container)`
Appends spacer + footer. Must be the last call before returning. See [Finalization](#finalization).

---

## Image Assets

When a template uses a thumbnail or media gallery, the file must be passed in `files` on the reply. Available assets in `src/img/`:

| File | Used in |
|------|---------|
| `bank.png` | `balanceMessage` |
| `clock.png` | `dailyCooldownMessage`, `weeklyCooldownMessage` |
| `gift.png` | `dailyRewardMessage`, `weeklyRewardMessage` |
| `die.png` | Game-related (misc) |
| `c1.gif`–`c5.gif` | `crateMessage` (opening animation) |
| `c1_5.png`–`c5_5.png` | `crateResultMessage` (result image) |
| `empty.png` | Placeholder when no image is needed |

---

## Worked Examples

### Economy Message (with thumbnail)

Uses `_sectionWithThumbnail` + direct `ContainerBuilder`:

```javascript
static balanceMessage(username, balance)
{
    const container = new ContainerBuilder()
        .setAccentColor(COLORS.PRIMARY)
        .addSectionComponents(
            this._sectionWithThumbnail(
                '# Carrot Bank',
                `>>> **Account Holder**\n\`${username}\``,
                'bank.png'
            )
        )
        .addSeparatorComponents(this._spacer())
        .addTextDisplayComponents(this._text(`### Carrots \`\`\`${formatted_balance}\`\`\``));
    return this._finalize(container);
}
```

Reply:
```javascript
message.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [MessageTemplates.balanceMessage(username, balance)],
    files: [{ attachment: 'src/img/bank.png', name: 'bank.png' }]
});
```

---

### Game Message (in progress)

Uses `_gameContainer` + `_betText` + game-specific content:

```javascript
static coinTossMessage(user, amount, frame)
{
    const container = this._gameContainer(COLORS.GOLD, user)
        .addTextDisplayComponents(this._text(`# Coin Toss`))
        .addTextDisplayComponents(this._betText(user, amount))
        .addSeparatorComponents(this._spacer())
        .addTextDisplayComponents(this._text(`# ═══════    ${frame ?? '🪙'}    ═══════`));
    return this._finalize(container);
}
```

**Element order for game messages:**
1. Title (`# Game Name`)
2. Bet text (`_betText`)
3. Spacer
4. Game content (cards, grid, animation frame, buttons)
5. Additional spacers / sections as needed
6. `_finalize`

---

### Game Result Message

Same structure as the in-progress message, but color changes to `SUCCESS` or `ERROR` and the title changes to `# You Win!` / `# You Lose!`. Buttons are disabled.

```javascript
static coinTossResultMessage(user, bet_amount, result)
{
    const won = result === 'win';
    const container = this._gameContainer(won ? COLORS.SUCCESS : COLORS.ERROR, user)
        .addTextDisplayComponents(this._text(`# ${won ? 'You Win!' : 'You Lose!'}`))
        .addTextDisplayComponents(this._betText(user, bet_amount))
        .addSeparatorComponents(this._spacer())
        .addTextDisplayComponents(this._text(`#  ═══════    🪙    ═══════`));
    return this._finalize(container);
}
```

---

### Appending a Game Result Breakdown

`appendGameResult` is called **after** the result message is sent, to append the payout calculation table. It is the only template method that mutates an existing message object rather than constructing a new one.

```javascript
// Called in gamba.js after game completes and items are applied
MessageTemplates.appendGameResult(
    result.message,     // the Discord message object to edit
    game_name,          // string, e.g. 'cointoss'
    bet_amount,         // original bet
    final_result.result,        // 'win' | 'loss' | 'push'
    final_result.base_payout,   // payout before item effects
    final_result.payout,        // final payout after items
    result_array        // array of {label, calc} steps from applyItemEffects
);
```

**How it works internally:**
1. Pops the last component (footer) from the existing container
2. Appends `## Result:` heading and an ANSI-formatted payout table
3. Re-calls `_finalize` to re-add the footer

Do not call `_finalize` on the message manually before passing it to `appendGameResult` — it will double-finalize. The message returned from the game's `play()` method is already finalized; `appendGameResult` handles the footer correctly.

---

### Error / Success (generic)

```javascript
// Error
MessageTemplates.errorMessage('You need to `^enroll` first!')

// Success
MessageTemplates.successMessage('Donation Successful!', `You donated **1,000** 🥕 to **username**!`)
```

These use `COLORS.ERROR` and `COLORS.SUCCESS` respectively, with a `## Error` / `## Title` heading and `>>>` body. Use these for one-off responses that don't need a custom template.

---

## ANSI Formatting

Used for colored text rendered inside triple-backtick code blocks:

```javascript
// Wrap text in ANSI color for level tier
this.colorLevelText('Level 42', 42)   // returns ANSI-colored string

// Usage in a template:
this._text(`\`\`\`ansi\n${coloredText}\`\`\``)
```

**ANSI-aware padding helpers** (use instead of `.padEnd`/`.padStart` when ANSI codes are present):

```javascript
this.padEndAnsi(string, target_length)    // left-align
this.padStartAnsi(string, target_length)  // right-align
this.padMidAnsi(string, target_length)    // center
this.visibleLength(string)                // length excluding ANSI escape codes
```

Standard `.padEnd()` / `.padStart()` will misalign columns when the string contains ANSI codes because JS counts escape characters in the string length. Always use the ANSI-aware variants in table rows.

---

## Common Mistakes

1. **Missing `IsComponentsV2` flag.** The message will fail. It must always be present.
2. **Using `new ContainerBuilder()` for a game message.** Active items header will not appear. Use `_gameContainer(color, user)`.
3. **Forgetting `_finalize()`.** The footer and trailing spacer will be missing.
4. **Manually constructing the footer.** Always use `_finalize()`. Never add `getStandardFooter()` directly.
5. **Using `.padEnd()`/`.padStart()` in ANSI table rows.** Columns will misalign. Use `padEndAnsi` / `padStartAnsi`.
6. **Not passing `files` when a thumbnail is used.** The thumbnail will not render. File `name` must exactly match the string used in `attachment://name`.
7. **Calling `_finalize` before `appendGameResult`.** `appendGameResult` expects the message to be finalized (it pops the footer itself), but re-finalizes it internally. The game's result message should be passed as-is from `play()`.