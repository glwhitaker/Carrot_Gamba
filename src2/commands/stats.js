import { db_manager } from "../db/db_manager.js";
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from "../utils/message_templates.js";

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
            const stats = await db_manager.getUserStats(user_id, guild_id);
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.userStatsMessage(user, stats)]
            });
        }

        // show stats for another user
        if(args.length === 1 && args[0].startsWith('<@') && args[0].endsWith('>'))
        {
            const mentioned_user_id = args[0].replace(/[<@!>]/g, '');
            const mentioned_user = await db_manager.getUser(mentioned_user_id, guild_id);

            if(mentioned_user)
            {
                const stats = await db_manager.getUserStats(mentioned_user_id, guild_id);
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.userStatsMessage(mentioned_user, stats)]
                });
            }
            else
            {
                return message.reply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [MessageTemplates.errorMessage(`User not found.`)]
                });
            }
        }
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
    });
}