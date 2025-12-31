import { db_manager } from '../db/db_manager.js';
import { item_manager } from '../items/item_manager.js';
import { game_manager } from '../games/game_manager.js';
import { xp_manager } from '../user/xp_manager.js';
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

        const final_result = await applyItemEffects(user, message, bet_amount, result, game);

        // wait for final result from item effects to update stats and balance
        await game.updateStats(user_id, guild_id, bet_amount, final_result.result, final_result.payout);
        await db_manager.updateUserBalance(user_id, guild_id, final_result.payout);

        const lvl_up = await db_manager.updateUserLevel(user_id, guild_id, bet_amount, final_result);
        // send user message instead of reply to message
        if(lvl_up)
        {
            const user = await db_manager.getUser(user_id, guild_id);
            const rewards = xp_manager.getLevelRewards(user.progression.level);
            await xp_manager.applyLevelRewards(user, user.progression.level);
            return message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.levelUpMessage(user, username, rewards)]
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

async function applyItemEffects(user, message, bet_amount, result, game)
{
    // placeholder for item effects application
    let modified_result = result;
    // loop through user's active items and apply effects
    const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);

    for(const item of active_items)
    {
        if(item.key === 'second_chance_token' && result.result === 'loss')
        {
            // item used message
            await message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.itemUsedMessage(user, item.key)]
            });
            // give user a second chance
            const second_chance_result = await game.play(user, message, bet_amount, item.key);
            modified_result = second_chance_result;
            // remove item from active items
            await item_manager.consumeItemForUser(user.user_id, user.guild_id, item.key, 1);
        }
    }

    return modified_result;
}