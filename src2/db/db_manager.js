import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config.js';

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

        // store in cache if found
        if(user)
            this.user_cache.set(key, user);

        return user;
    }

    async enrollUser(user_id, guild_id, username, current_time)
    {
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

        // update cache
        const key = `${user_id}-${guild_id}`;
        this.user_cache.set(key,
        {
            user_id: user_id,
            guild_id: guild_id,
            username: username,
            balance: config.STARTING_BALANCE,
            enrollment_date: current_time,
            last_message_date: current_time,
            last_daily_claim: null,
            last_weekly_claim: null,
            is_dirty: false
        });
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
    }

    // function to be on timer to update all users in cache to db if dirty
    async updateAllUsers()
    {
        console.log("\nUpdating all dirty users to database...");
        for(const user of this.user_cache.values())
        {
            if(user.is_dirty)
            {
                console.log("Updating user: " + user.username);
                await this.updateUser(user.user_id, user.guild_id);
                user.is_dirty = false;
            }
        }
    }

    async getUserBalance(user_id, guild_id)
    {
        const user = await this.getUser(user_id, guild_id);
        return user ? user.balance : null;
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