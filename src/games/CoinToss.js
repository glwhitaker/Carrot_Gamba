import { Game } from './Game.js';
import { item_manager } from "../items/item_manager.js";
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class CoinToss extends Game
{
    constructor()
    {
        super('cointoss');
    }

    async play(user, message, bet_amount)
    {
        const username = message.author.username;

        const win = Math.random() < 0.5;
        const payout = win ? bet_amount : -bet_amount;
        const base_payout = bet_amount;
        const result = win ? 'win' : 'loss';

        const animation_frames = ['💫', '🪙', '💫', '🪙'];

        // send initial message that game has started
        const game_message = await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.coinTossMessage(username, bet_amount)]
        });

        // animate coin toss
        for (const frame of animation_frames) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await game_message.edit({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.coinTossMessage(username, bet_amount, frame)]
            });
        }

        // show final result after animation
        await game_message.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.coinTossResultMessage(username, bet_amount, result)
            ]
        });

        const res = {result: result, payout: payout, message: game_message, base_payout: base_payout};
        
        return res;
    }
}