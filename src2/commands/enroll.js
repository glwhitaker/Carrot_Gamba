import { db_manager } from '../db/db_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { MessageFlags } from 'discord.js';

export async function handleEnroll(args, message)
{
    // get basic user info from message
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;
    const current_time = new Date().toISOString();

    const user = await db_manager.getUser(user_id, guild_id);
    
    if(user)
    {
        // if user already enrolled, return balance
        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.balanceMessage(username, user.balance)],
            files: [{
                attachment:'src2/img/bank.png',
                name:'image.png'
            }]
        });
    }
    
    // enroll the user if not there
    await db_manager.enrollUser(user_id, guild_id, username, current_time);

    return message.reply({ 
        embeds: [
            MessageTemplates.successMessage
            (
                'Welcome!',
                `You have been enrolled with ${MessageTemplates.formatNumber(config.STARTING_BALANCE)} carrots! 🥕`
            )
        ]
    });
}