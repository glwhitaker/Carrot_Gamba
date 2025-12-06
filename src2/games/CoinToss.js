import { Game } from './Game.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class CoinToss extends Game
{
    constructor()
    {
        super('cointoss');
    }

    async play(message, bet_amount)
    {
        const user_id = message.author.id;
        const guild_id = message.guild.id;

        const win = Math.random() < 0.5;
        const payout = win ? bet_amount : -bet_amount;
        const result = win ? 'win' : 'loss';

        const animation_frames = ['✨', '🪙', '💫', '🪙', '✨', '🪙', '💫', '🪙', '✨'];

        console.log("cointoss "+payout);
        // send initial message that game has started
        // const game_message = await message.reply({
        //     flags: MessageFlags.IsComponentsV2,
        //     components: [MessageTemplates.coinTossEmbed(message.author.username, bet_amount)]
        // });
        // animate coin toss

        // show final result after animation

        await this.updateStats(user_id, guild_id, bet_amount, result, payout);
        
        return payout;
    }
}