import { getDatabase } from '../database/db.js';

export class Game {
    constructor(name, minBet = 10) {
        this.name = name;
        this.minBet = minBet;
    }

    parseBet(args) {
        const bet = parseInt(args[1]); // Default implementation assumes bet is second argument
        if (isNaN(bet) || !this.validateBet(bet)) {
            return { error: `Bet must be at least ${this.minBet} carrots` };
        }
        return { bet };
    }

    validateBet(amount) {
        return amount >= this.minBet;
    }

    // abstract method to be implemented by subclasses (specific games)
    async play(bet) {
        throw new Error('play method must be implemented by subclasses');
    }

    /**
     * Update game and player statistics after a game
     * @param {string} userId - Player's Discord ID
     * @param {string} guildId - Guild's Discord ID
     * @param {number} betAmount - Amount bet
     * @param {string} result - Game result ('win', 'loss', 'push', 'timeout')
     * @param {number} payout - Amount won/lost (positive for win, negative for loss)
     */
    async updateGameStats(userId, guildId, betAmount, result, payout) {
        const db = getDatabase();
        
        try {
            await db.run('BEGIN TRANSACTION');

            // Update player_stats
            await db.run(`
                UPDATE player_stats 
                SET total_games_played = total_games_played + 1,
                    total_games_won = total_games_won + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                    total_games_lost = total_games_lost + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                    total_money_won = total_money_won + CASE WHEN ? > 0 THEN ? ELSE 0 END,
                    total_money_lost = total_money_lost + CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END,
                    highest_single_win = MAX(highest_single_win, CASE WHEN ? > 0 THEN ? ELSE 0 END),
                    highest_single_loss = MAX(highest_single_loss, CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END),
                    last_updated = CURRENT_TIMESTAMP
                WHERE user_id = ? AND guild_id = ?`,
                [result, result, payout, payout, payout, payout, payout, payout, payout, payout, userId, guildId]
            );

            // Update game_stats
            await db.run(`
                UPDATE game_stats 
                SET total_games_played = total_games_played + 1,
                    total_games_won = total_games_won + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                    total_games_lost = total_games_lost + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                    total_money_wagered = total_money_wagered + ?,
                    total_money_won = total_money_won + CASE WHEN ? > 0 THEN ? ELSE 0 END,
                    total_money_lost = total_money_lost + CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END,
                    last_updated = CURRENT_TIMESTAMP
                WHERE game_name = ?`,
                [result, result, betAmount, payout, payout, payout, payout, this.name]
            );

            // Add to game_history
            await db.run(`
                INSERT INTO game_history (
                    game_name, user_id, guild_id, bet_amount, result, payout
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [this.name, userId, guildId, betAmount, result, payout]
            );

            await db.run('COMMIT');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error('Error updating game stats:', error);
        }
    }
}