import { db_manager } from "../db/db_manager.js";
import { game_manager } from "./game_manager.js";
import { message_dispatcher } from "../utils/message_dispatcher.js";
import { MessageTemplates } from "../utils/message_templates.js";
import { MessageFlags } from 'discord.js';

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

    async safeDeferUpdate(interaction)
    {
        try
        {
            await interaction.deferUpdate();
        }
        catch(e)
        {
            console.error(`[${this.name}] Failed to defer interaction:`, e.message);
            return false;
        }
        return true;
    }

    async handleInteractionError(game_message)
    {
        await message_dispatcher.edit(game_message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage('Something went wrong. Your bet has been returned.')]
        }, message_dispatcher.PRIORITY.HIGH);
        return {result: 'error', payout: 0, message: game_message, base_payout: 0};
    }

    async handleTimeout(user, game_message)
    {
        game_manager.endGame(user.user_id, user.guild_id);
        var res = {result: 'timeout', payout: 0, message: game_message, base_payout: 0};
        return res;
    }
}