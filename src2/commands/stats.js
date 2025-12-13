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
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
    });
}