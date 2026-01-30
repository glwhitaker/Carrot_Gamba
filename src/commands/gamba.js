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

        // build result modification array to show final result message
        let result_array = [];
        const final_result = await applyItemEffects(user, message, bet_amount, result, game, result_array);

        // timeout for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // send result message
        final_result.message.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.appendGameResult(
                final_result.message,
                game.name,
                bet_amount,
                final_result.result,
                final_result.base_payout,
                final_result.payout,
                result_array
            )]
        });

        const xp = xp_manager.calculateXP(user, bet_amount, final_result);
        
        // DEBUG
        // for(let i = 1; i <= 100; i++)
        // {
        //     await xp_manager.getLevelRewards(i);
        // }

        // wait for final result from item effects to update stats and balance
        await db_manager.updateUserBalance(user_id, guild_id, final_result.payout);
        await game.updateStats(user_id, guild_id, bet_amount, final_result.result, final_result.payout);

        const lvl_up = await db_manager.updateUserLevel(user_id, guild_id, xp);
        // send user message instead of reply to message
        if(lvl_up)
        {
            const rewards = xp_manager.getLevelRewards(user.progression.level);
            message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.levelUpMessage(user, username, rewards)]
            });
            await xp_manager.applyLevelRewards(user, user.progression.level);
            return;
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

async function sendItemMessage(user, item_key, message)
{
    // slight delay
    await new Promise(resolve => setTimeout(resolve, 500));

    await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.itemUsedMessage(user, item_key)]
    });
}

async function applyItemEffects(user, message, bet_amount, result, game, result_array)
{
    // placeholder for item effects application
    let modified_result = result;
    const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);

    // first check for second chance token
    if(active_items['sc'])
    {
        // consume item
        await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'sc', 1);

        if(result.result === 'loss')
        {
            await sendItemMessage(user, 'sc', message);
            // give user a second chance
            const second_chance_result = await game.play(user, message, bet_amount, 'sc');
            modified_result = second_chance_result;
            if(modified_result.result === 'win')
            {
                modified_result.payout = Math.floor(modified_result.payout * 0.5);
                result_array.push({label: 'Second Chance', calc: 'x 0.5'});
            }
        }
    }

    if(active_items['lc'])
    {
        if(modified_result.result === 'loss')
        {
            modified_result.payout = Math.floor(modified_result.payout * 0.5);
            result_array.push({label: 'Loss Cushion', calc: 'x 0.5'})
        }
        // consume item
        await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'lc', 1);
    }

    // then apply win modifiers
    if(active_items['jj'])
    {
        if(modified_result.result === 'win')
        {
            modified_result.payout = modified_result.payout * 2;
            result_array.push({label: 'Jackpot Juice', calc: 'x 2'});
        }
        // consume item
        await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'jj', 1);
    }

    if(active_items['cs'])
    {
        // if win add 10% to payout
        if(modified_result.result === 'win')
        {
            modified_result.payout = Math.floor(modified_result.payout * 1.1);
            result_array.push({label: `Carrot Surge (${active_items['cs']-1})`, calc: '+ 10%'})
        }
        // consume regardless of win/loss
        await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'cs', 1);
    }

    return modified_result;
}