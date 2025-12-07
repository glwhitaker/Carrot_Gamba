import { db_manager } from '../db/db_manager.js';
import { game_manager } from '../games/game_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleGamba(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;
    const current_time = new Date();

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        if(args.length !== 2)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
            });
        }

        const game_name = args[0];
        const game = game_manager.getGame(game_name);

        if(!game)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(
                    `Invalid game. Available games: **${game_manager.listGames().join(', ')}**`
                )]
            });
        }

        let bet_amount = args[1];
        if(bet_amount.toLowerCase() === 'max')
            bet_amount = user.balance;
        else if(isNaN(bet_amount) || bet_amount < 10)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(
                    `Invalid bet amount. Minimum bet for **${game.name}** is **${game.min_bet}** carrots.`
                )]
            });
        }
        else
            bet_amount = parseInt(bet_amount);

        if(user.balance < bet_amount)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Insufficient balance.\nYour balance: **'+ MessageTemplates.formatNumber(user.balance) + '** 🥕')]
            });
        }
        
        const result = await game.play(user, message, bet_amount);

        await db_manager.updateUserBalance(user_id, guild_id, result.payout);
        const lvl_up = await db_manager.updateUserLevel(user_id, guild_id, bet_amount, result);

        // send user message instead of reply to message
        if(lvl_up)
        {
            const user = await db_manager.getUser(user_id, guild_id);
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.levelUpMessage(user, username)]
            });
        }
    }
    else
    {
        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
        });
    }
}