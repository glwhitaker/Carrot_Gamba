import { db_manager } from "../db/db_manager.js";
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from "../utils/message_templates.js";
import { game_manager } from "../games/game_manager.js";
import { message_dispatcher } from '../utils/message_dispatcher.js';

export async function handleStats(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        // parse args
        if(args.length === 0 || (args.length === 1 && args[0].toLowerCase() === 'me'))
        {
            // show stats for self
            const [stats, win_rate_trend] = await Promise.all([
                db_manager.getUserStats(user_id, guild_id),
                db_manager.getWinRateTrend(user_id, guild_id)
            ]);
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.userStatsMessage(user, stats, win_rate_trend)]
            });
        }
        // show stats for another user
        if(args.length === 1 && args[0].startsWith('<@') && args[0].endsWith('>'))
        {
            const mentioned_user_id = args[0].replace(/[<@!>]/g, '');
            const mentioned_user = await db_manager.getUser(mentioned_user_id, guild_id);

            if(mentioned_user)
            {
                const [stats, win_rate_trend] = await Promise.all([
                    db_manager.getUserStats(mentioned_user_id, guild_id),
                    db_manager.getWinRateTrend(mentioned_user_id, guild_id)
                ]);
                return message_dispatcher.reply(message, {
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.userStatsMessage(mentioned_user, stats, win_rate_trend)]
                });
            }
            else
            {
                return message_dispatcher.reply(message, {
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.errorMessage(`User not found.`)]
                }, message_dispatcher.PRIORITY.HIGH);
            }
        }
        else if(args.length === 2 && args[0].toLowerCase() === 'games')
        {
            // check to see if they're requesting stats for a specific game or all games
            const game_name = args[1].toLowerCase();
            if(game_name)
            {
                // return in depth stats for specific game
                const game = game_manager.getGame(game_name);
                if(game)
                {
                    const user_stats = await db_manager.getUserGameStats(user_id, guild_id, game_name);
                    const global_stats = await db_manager.getGlobalGameStats(guild_id, game_name);
                    return message_dispatcher.reply(message, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [MessageTemplates.userGameStatsMessage(user, game_name, user_stats, global_stats)]
                    });
                }
                else
                {
                    return message_dispatcher.reply(message, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [MessageTemplates.errorMessage(`Game not found. Available games: ${game_manager.listGames().join(', ')}`)]
                    }, message_dispatcher.PRIORITY.HIGH);
                }
            }
            else
            {
                // return basic stats for all games
                const user_stats = await db_manager.getUserAllGameStats(user_id, guild_id);
                const global_stats = await db_manager.getGlobalAllGameStats(guild_id);
                return message_dispatcher.reply(message, {
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.userAllGameStatsMessage(user, user_stats, global_stats)]
                });
            }
        }
        else
        {
            return message_dispatcher.reply(message, {
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
                }, message_dispatcher.PRIORITY.HIGH);
        }
    }

    return message_dispatcher.reply(message, {
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    }, message_dispatcher.PRIORITY.HIGH);
}