import { db_manager } from "../db/db_manager.js";
import { game_manager } from "./game_manager.js"

export class Game
{
    constructor(name)
    {
        this.name = name;
        this.min_bet = 10;
    }

    async updateStats(user_id, guild_id, bet_amount, result, payout)
    {
        // log game history
        await db_manager.addGameToHistory(user_id, guild_id, this.name, result, bet_amount, payout);
        
        // update game stats
        await db_manager.updateGameStats(this.name, result, bet_amount, payout);

        // update player stats
        await db_manager.updateUserStats(user_id, guild_id, result, payout);
    }

    async handleTimeout(user, game_message)
    {
        game_manager.endGame(user.user_id, user.guild_id);
        var res = {result: 'timeout', payout: 0, message: game_message, base_payout: 0};
        return res;
    }
}