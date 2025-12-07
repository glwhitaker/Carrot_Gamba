import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config.js';
import { xp_manager } from '../user/xp_manager.js';

// Singleton class to manage the database connection
class DBManager
{
    constructor()
    {
        this.db = null;
        this.init();

        this.user_cache = new Map();
    }

    async init()
    {
        this.db = await open(
        {
            filename: './carrot_gamba_v2.db',
            driver: sqlite3.Database
        });

        try
        {
            // start transaction to validate tables
            await this.db.exec('BEGIN TRANSACTION');

            // create users table if it doesn't exist
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS users
                (
                    user_id TEXT,
                    guild_id TEXT,
                    username TEXT,
                    balance INTEGER DEFAULT 1000,
                    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_message_date DATETIME,
                    last_daily_claim DATETIME,
                    last_weekly_claim DATETIME,
                    PRIMARY KEY (user_id, guild_id)
                )
            `);

            // create user_progression table if it doesn't exist
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS user_progression
                (
                    user_id TEXT,
                    guild_id TEXT,
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    streak INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, guild_id)
                )
            `);

            // create player_stats table if it doesn't exist
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS player_stats
                (
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
                    PRIMARY KEY (user_id, guild_id)
                )
            `);

            // Create game_stats table
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS game_stats
                (
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
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS game_history
                (
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
            await this.db.exec(`
                INSERT OR IGNORE INTO game_stats (game_name) VALUES 
                ('blackjack'),
                ('numberguess'),
                ('cointoss')
            `);

            await this.db.exec('COMMIT');
            console.log('[Database] Database initialized successfully.');

        }
        catch(error)
        {
            await this.db.exec('ROLLBACK');
            console.error('[Error] Error initializing database:', error);
        }
    }

    async getUsers()
    {
        return await this.db.all('SELECT * FROM users');
    }

    async getUser(user_id, guild_id)
    {
        // check cache first
        const key = `${user_id}-${guild_id}`;

        if(this.user_cache.has(key))
            return this.user_cache.get(key);

        const user = await this.db.get(`
            SELECT *
            FROM users
            WHERE user_id = ?
            AND guild_id = ?
            `,
            [user_id, guild_id]
        );

        const progression = await this.db.get(`
            SELECT *
            FROM user_progression
            WHERE user_id = ?
            AND guild_id = ?
            `,
            [user_id, guild_id]
        );

        // store in cache if found
        if(user && progression)
        {
            const full_user = {};
            full_user.user_id = user.user_id;
            full_user.guild_id = user.guild_id;
            full_user.username = user.username;
            full_user.balance = user.balance;
            full_user.enrollment_date = user.enrollment_date;
            full_user.last_message_date = user.last_message_date;
            full_user.last_daily_claim = user.last_daily_claim;
            full_user.last_weekly_claim = user.last_weekly_claim;
            full_user.is_dirty = false;

            full_user.progression = {};
            full_user.progression.xp = progression.xp;
            full_user.progression.level = progression.level;
            full_user.progression.streak = progression.streak;

            this.user_cache.set(key, full_user);

            return full_user;
        }
        
        return null;
    }

    async enrollUser(user_id, guild_id, username, current_time)
    {
        // insert into users
        await this.db.run(`
            INSERT INTO users(
                user_id,
                guild_id,
                username,
                balance,
                enrollment_date,
                last_message_date
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                guild_id,
                username,
                config.STARTING_BALANCE,
                current_time,
                current_time
            ]
        );

        // insert into user_progression
        await this.db.run(`
            INSERT INTO user_progression
            (
                user_id,
                guild_id,
                xp,
                level,
                streak
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                guild_id,
                0,
                1,
                0
            ]
        );
        // insert into player_stats
        await this.db.run(`
            INSERT INTO player_stats
            (
                user_id,
                guild_id,
                total_games_played,
                total_games_won,
                total_games_lost,
                highest_balance,
                highest_single_win,
                highest_single_loss,
                last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                guild_id,
                0,
                0,
                0,
                0,
                0,
                0,
                current_time
            ]
        );

        // update cache
        const key = `${user_id}-${guild_id}`;

        const user = {};
        user.user_id = user_id;
        user.guild_id = guild_id;
        user.username = username;
        user.balance = config.STARTING_BALANCE;
        user.enrollment_date = current_time;
        user.last_message_date = current_time;
        user.last_daily_claim = null;
        user.last_weekly_claim = null;
        user.is_dirty = false;

        user.progression = {};
        user.progression.xp = 0;
        user.progression.level = 1;
        user.progression.streak = 0;

        this.user_cache.set(key, user);
    }

    async updateUser(user_id, guild_id)
    {
        // sync db with cache
        const key = `${user_id}-${guild_id}`;
        const user = this.user_cache.get(key);

        if(!user)
        {
            user = await this.getUser(user_id, guild_id);
        }

        await this.db.run(`
            UPDATE users
            SET
                username = ?,
                balance = ?,
                last_message_date = ?,
                last_daily_claim = ?,
                last_weekly_claim = ?
            WHERE user_id = ?
            AND guild_id = ?`,
            [
                user.username,
                user.balance,
                user.last_message_date,
                user.last_daily_claim,
                user.last_weekly_claim,
                user_id,
                guild_id
            ]
        );

        // update all time balance in player_stats if needed
        await this.db.run(`
            UPDATE player_stats
            SET
                highest_balance = MAX(highest_balance, ?)
            WHERE user_id = ?
            AND guild_id = ?`,
            [
                user.balance,
                user_id,
                guild_id
            ]
        );
    }

    async updateUserProgression(user_id, guild_id)
    {
        // sync db with cache
        const key = `${user_id}-${guild_id}`;
        const user = this.user_cache.get(key);

        if(!user)
        {
            user = await this.getUser(user_id, guild_id);
        }
        
        await this.db.run(`
            UPDATE user_progression
            SET
                xp = ?,
                level = ?,
                streak = ?
            WHERE user_id = ?
            AND guild_id = ?`,
            [
                user.progression.xp,
                user.progression.level,
                user.progression.streak,
                user_id,
                guild_id
            ]
        );
    }

    // function to be on timer to update all users in cache to db if dirty
    async updateAllUsers()
    {
        console.log("[Database] Updating users...");
        for(const user of this.user_cache.values())
        {
            if(user.is_dirty)
            {
                console.log("\tUpdating user: " + user.username);
                await this.updateUser(user.user_id, user.guild_id);
                await this.updateUserProgression(user.user_id, user.guild_id);
                user.is_dirty = false;
            }
        }
    }

    async getUserBalance(user_id, guild_id)
    {
        const user = await this.getUser(user_id, guild_id);
        return user ? user.balance : null;
    }

    async updateLastDailyClaim(user_id, guild_id, timestamp)
    {
        const user = await this.getUser(user_id, guild_id);

        if(user)
        {
            user.last_daily_claim = timestamp;
            user.is_dirty = true;
        }
    }

    async updateLastWeeklyClaim(user_id, guild_id, timestamp)
    {
        const user = await this.getUser(user_id, guild_id);

        if(user)
        {
            user.last_weekly_claim = timestamp;
            user.is_dirty = true;
        }
    }

    async updateUserBalance(user_id, guild_id, amount)
    {
        const user = await this.getUser(user_id, guild_id);

        if(user)
        {
            user.balance += amount;
            user.is_dirty = true;
        }
    }

    async updateUserLevel(user_id, guild_id, bet_amount, result)
    {
        const user = await this.getUser(user_id, guild_id);
        const result_type = result.result;

        const xp = xp_manager.calculateXP(user, bet_amount, result_type);

        // update user progression
        user.progression.xp += xp;

        // check for level up
        let leveled_up = false;
        while(user.progression.xp >= xp_manager.requiredXPForLevel(user.progression.level))
        {
            user.progression.xp -= xp_manager.requiredXPForLevel(user.progression.level);
            user.progression.level += 1;
            leveled_up = true;
        }

        user.is_dirty = true;

        return leveled_up;
    }

    async updateUserStats(user_id, guild_id, result, payout)
    {
        const user = await this.getUser(user_id, guild_id);
        const current_balance = user ? user.balance : 0;
        await this.db.run(`
            UPDATE player_stats
            SET
                total_games_played = total_games_played + 1,
                total_games_won = total_games_won + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                total_games_lost = total_games_lost + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                total_money_won = total_money_won + CASE WHEN ? > 0 THEN ? ELSE 0 END,
                total_money_lost = total_money_lost + CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END,
                highest_balance = MAX(highest_balance, ?),
                highest_single_win = MAX(highest_single_win, CASE WHEN ? > 0 THEN ? ELSE 0 END),
                highest_single_loss = MAX(highest_single_loss, CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END),
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = ?
            AND guild_id = ?`,
            [
                result,
                result,
                payout,
                payout,
                payout,
                payout,
                current_balance,
                payout,
                payout,
                payout,
                payout,
                user_id,
                guild_id
            ]
        );
    }

    async addGameToHistory(user_id, guild_id, game_name, result, bet_amount, payout)
    {
        await this.db.run(`
            INSERT INTO game_history
            (
                game_name,
                user_id,
                guild_id,
                bet_amount,
                result,
                payout
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                game_name,
                user_id,
                guild_id,
                bet_amount,
                result,
                payout
            ]
        );
    }

    async updateGameStats(game_name, result, bet_amount, payout)
    {
        await this.db.run(`
            UPDATE game_stats
            SET
                total_games_played = total_games_played + 1,
                total_games_won = total_games_won + CASE WHEN ? = 'win' THEN 1 ELSE 0 END,
                total_games_lost = total_games_lost + CASE WHEN ? = 'loss' THEN 1 ELSE 0 END,
                total_money_wagered = total_money_wagered + ?,
                total_money_won = total_money_won + CASE WHEN ? > 0 THEN ? ELSE 0 END,
                total_money_lost = total_money_lost + CASE WHEN ? < 0 THEN ABS(?) ELSE 0 END,
                last_updated = CURRENT_TIMESTAMP
            WHERE game_name = ?`,
            [
                result,
                result,
                bet_amount,
                payout,
                payout,
                payout,
                payout,
                game_name
            ]
        );
    }
}

class DBManagerSingleton
{
    constructor()
    {
        if(!DBManagerSingleton.instance)
        {
            DBManagerSingleton.instance = new DBManager();
        }
    }

    getInstance()
    {
        return DBManagerSingleton.instance;
    }
}

export const db_manager = new DBManagerSingleton().getInstance();