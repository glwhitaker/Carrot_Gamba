# Trendline System

## Overview
Trendlines are block-character area charts rendered in Discord code blocks. They visualize user statistics over the last 7 days (168 hours), bucketed into 3-hour intervals. The renderer is statistic-agnostic — any array of normalized values (0.0–1.0) produces a chart.

Currently displayed on `^stats` via `userStatsMessage()`.

## Architecture

### Data Flow
1. **Query** — `db_manager` method fetches raw data from `game_history`, buckets into 3-hour chunks, returns normalized values
2. **Normalize** — Values mapped to 0.0–1.0 range (e.g., win rate is already 0–1, other stats would need min/max normalization)
3. **Render** — `MessageTemplates.trendline(data)` produces a multi-line string of block characters
4. **Display** — Wrapped in a code block and added to the stats embed

### Grid Dimensions
- **X-axis**: 56 columns — one per 3-hour bucket (56 × 3h = 168h = 7 days)
- **Y-axis**: 4 rows — each row represents 25% of the value range
- **Sub-resolution**: 8 block heights per row (`▁▂▃▄▅▆▇█`) = 32 total vertical levels (~3.1% per step)
- **Width**: Matches the 56-character code block width used by stats messages

### Block Characters
```
█  full (8/8)
▇  7/8
▆  6/8
▅  5/8
▄  4/8 (half)
▃  3/8
▂  2/8
▁  1/8
   empty (0/8)
```

## Renderer — `MessageTemplates.trendline(data)`

**Location**: `src/utils/message_templates.js`

**Input**: `data` — array of numbers in [0.0, 1.0]. Length determines column count (currently 56).

**Output**: Multi-line string (4 lines). Area-under-curve style — all cells below the value are filled solid, the cell at the value gets a partial block.

**Algorithm**:
```
for each row (top to bottom):
  for each column:
    if value >= row_max  → '█' (full)
    if value >  row_min  → partial block based on position within band
    else                 → ' ' (empty)
```

The renderer is statistic-agnostic. Any future trendline just needs to provide a normalized array.

## Current Trendlines

### Win Rate (`db_manager.getWinRateTrend`)

**Query**: All rows from `game_history` for the user in the last 168 hours, ordered by timestamp.

**Bucketing**: Each game's timestamp is mapped to a bucket index via:
```
bucket = floor((game_time - window_start) / 3 hours)
```

**Win rate per bucket**: `wins / total` games in that bucket.

**Empty bucket handling**: Carry-forward — if a bucket has zero games, it inherits the previous bucket's win rate. The first bucket defaults to 0 if empty.

**Returns**: `Number[56]` — values in [0.0, 1.0], ready for `trendline()`.

## Adding a New Trendline

1. **Add a query method** in `db_manager.js` that returns `Number[56]` of normalized values (0.0–1.0)
   - Bucket by 3-hour intervals over the last 168 hours
   - Handle empty buckets (carry-forward, zero-fill, or interpolation depending on the stat)
2. **Fetch data** alongside existing stats in the relevant command handler (e.g., `stats.js`), using `Promise.all` for parallel queries
3. **Pass to the template** — add the data array as a parameter to the message builder
4. **Render** — call `this.trendline(data)` and wrap in a code block:
   ```javascript
   const chart = `\`\`\`\n${this.trendline(data)}\n\`\`\``;
   ```
5. **Add to container** with a heading:
   ```javascript
   container.addTextDisplayComponents(
       this._text('### Chart Title — Last 7 Days'),
       this._text(chart)
   );
   ```

## Timestamp Handling
SQLite's `CURRENT_TIMESTAMP` stores UTC strings without a `Z` suffix. When parsing in JS, append `'Z'` to ensure correct UTC interpretation:
```javascript
const game_time = new Date(game.timestamp + 'Z').getTime();
```
