import { db_manager } from '../db/db_manager.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleBalance(args, message)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;

    const balance = await db_manager.getUserBalance(user_id, guild_id);

    if(balance !== null)
    {
        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.balanceMessage(username, balance)],
            files: [{
                attachment:'src2/img/bank.png',
                name:'image.png'
            }]
        });
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}
