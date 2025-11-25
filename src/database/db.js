import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { enrollmentCache } from '../utils/enrollmentCache.js';

let db = null;

// initialize the database connection
export async function initializeDatabase() {
    if(db) return db;

    // create a new database file if it doesn't exist
    db = await open({
        filename: './carrot_gamba.db',
        driver: sqlite3.Database
    });

    try {
        // Start transaction for table creation
        await db.exec('BEGIN TRANSACTION');

        // Create users table if it doesn't exist (existing table)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT,
                guild_id TEXT,
                username TEXT,
                balance INTEGER DEFAULT 1000,
                enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_message_date DATETIME,
                last_daily_claim DATETIME,
                PRIMARY KEY (user_id, guild_id)
            )
        `);

        // Create player_stats table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS player_stats (
                user_id TEXT,
                guild_id TEXT,
                total_games_played INTEGER DEFAULT 0,
                total_games_won INTEGER DEFAULT 0,
                total_games_lost INTEGER DEFAULT 0,
                total_money_won INTEGER DEFAULT 0,
                total_money_lost INTEGER DEFAULT 0,
                highest_balance INTEGER DEFAULT 0,
                highest_single_win INTEGER DEFAULT 0,
                highest_single_loss INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, guild_id),
                FOREIGN KEY (user_id, guild_id) 
                    REFERENCES users(user_id, guild_id)
                    ON DELETE CASCADE
            )
        `);

        // Create game_stats table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS game_stats (
                game_name TEXT PRIMARY KEY,
                total_games_played INTEGER DEFAULT 0,
                total_games_won INTEGER DEFAULT 0,
                total_games_lost INTEGER DEFAULT 0,
                total_money_wagered INTEGER DEFAULT 0,
                total_money_won INTEGER DEFAULT 0,
                total_money_lost INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create game_history table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS game_history (
                game_id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_name TEXT,
                user_id TEXT,
                guild_id TEXT,
                bet_amount INTEGER,
                result TEXT CHECK(result IN ('win', 'loss', 'push', 'timeout')),
                payout INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id, guild_id) 
                    REFERENCES users(user_id, guild_id)
                    ON DELETE CASCADE
            )
        `);

        // Initialize game_stats with existing games
        await db.exec(`
            INSERT OR IGNORE INTO game_stats (game_name) VALUES 
            ('blackjack'),
            ('numberguess'),
            ('cointoss')
        `);

        // Create trigger to initialize player_stats when a user enrolls
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS init_player_stats 
            AFTER INSERT ON users
            BEGIN
                INSERT INTO player_stats (user_id, guild_id)
                VALUES (NEW.user_id, NEW.guild_id);
            END
        `);

        // Create trigger to update highest_balance in player_stats
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_highest_balance 
            AFTER UPDATE OF balance ON users
            WHEN NEW.balance > (
                SELECT highest_balance 
                FROM player_stats 
                WHERE user_id = NEW.user_id 
                AND guild_id = NEW.guild_id
            )
            BEGIN
                UPDATE player_stats 
                SET highest_balance = NEW.balance
                WHERE user_id = NEW.user_id 
                AND guild_id = NEW.guild_id;
            END
        `);

        await db.exec('COMMIT');
        console.log('Database schema initialized successfully');

        return db;

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error initializing database schema:', error);
        throw error;
    }
}

// Add this after the schema initialization
export async function initializeExistingUsers() {
    const db = getDatabase();
    try {
        await db.exec(`
            INSERT OR IGNORE INTO player_stats (user_id, guild_id)
            SELECT user_id, guild_id FROM users
        `);
        console.log('Existing users initialized with stats records');
    } catch (error) {
        console.error('Error initializing existing users:', error);
    }
}

// export the database connection
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

// enrollment check
export async function isUserEnrolled(userId, guildId) {
    // check cache first
    const cached = enrollmentCache.get(userId, guildId);
    
    if (cached !== null) return cached;

    // check database
    const db = getDatabase();
    const user = await db.get('SELECT 1 FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    const enrolled = !!user;

    // cache result
    enrollmentCache.set(userId, guildId, enrolled);

    return enrolled;
}

export async function getLeaderboard(guildId, limit = 20) {
    const db = getDatabase();
    return await db.all(
        `SELECT username, balance
        FROM users
        WHERE guild_id = ?
        ORDER BY balance DESC
        LIMIT ?`,
        [guildId, limit]
    );
}

export async function getAllTimeLeaderboard(guildId, limit = 20) {
    const db = getDatabase();
    return await db.all(
        `SELECT u.username username, p.highest_balance balance
        FROM users u, player_stats p
        WHERE u.guild_id = ?
        AND p.guild_id = u.guild_id
        AND u.user_id = p.user_id
        ORDER BY p.highest_balance DESC
        LIMIT ?`,
        [guildId, limit]
    );
}

/**
 * Update a user's balance
 * @param {string} userId - The user's Discord ID
 * @param {string} guildId - The guild's Discord ID
 * @param {number} points - Points to add (positive) or subtract (negative)
 * @param {string} [reason] - Optional reason for the point change (for logging)
 * @returns {Promise<{success: boolean, newBalance: number, error?: string}>}
 */
export async function updateUserBalance(userId, guildId, points, reason = '') {
    const db = getDatabase();
    
    try {
        // Start transaction
        await db.run('BEGIN TRANSACTION');

        // Get current balance
        const user = await db.get(
            'SELECT balance FROM users WHERE user_id = ? AND guild_id = ?',
            [userId, guildId]
        );

        if (!user) {
            await db.run('ROLLBACK');
            return {
                success: false,
                error: 'User not enrolled'
            };
        }

        const newBalance = user.balance + points;

        // Prevent negative balance (optional, remove if you want to allow debt)
        if (newBalance < 0) {
            await db.run('ROLLBACK');
            return {
                success: false,
                error: 'Insufficient balance',
                newBalance: user.balance
            };
        }

        // Update balance
        await db.run(
            'UPDATE users SET balance = ? WHERE user_id = ? AND guild_id = ?',
            [newBalance, userId, guildId]
        );

        // Log the transaction (optional)
        console.log(`   Balance update: ${points} points (${reason}). New balance: ${newBalance}`);

        await db.run('COMMIT');

        return {
            success: true,
            newBalance
        };

    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error updating balance:', error);
        return {
            success: false,
            error: 'Database error'
        };
    }
}

export async function resetAllDailyTimers() {
    const db = getDatabase();
    try {
        await db.run('UPDATE users SET last_daily_claim = NULL');
        console.log('Successfully reset all daily claim timers');
        return true;
    } catch (error) {
        console.error('Error resetting daily timers:', error);
        return false;
    }
}
