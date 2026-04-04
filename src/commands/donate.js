import { db_manager } from '../db/db_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export async function handleDonate(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        if(args.length !== 2)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
            }, message_dispatcher.PRIORITY.HIGH);
        }

        // parse user mention
        const target_user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        // validations
        if(!target_user)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Please mention a user to donate to!')]
            }, message_dispatcher.PRIORITY.HIGH)
        }

        const t_user = await db_manager.getUser(target_user.id, guild_id);

        if(!t_user)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`${target_user.username} needs to \`^enroll\` first!`)]
            }, message_dispatcher.PRIORITY.HIGH);
        }

        if(target_user.id === user_id)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('You cannot donate to yourself!')]
            }, message_dispatcher.PRIORITY.HIGH);
        }

        if(isNaN(amount) || amount <= 0)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Please enter a valid amount to donate!')]
            }, message_dispatcher.PRIORITY.HIGH);
        }

        if(user.balance < amount)
        {
            return message_dispatcher.reply(message, {
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`You don't have enough carrots!\nYour balance: **${MessageTemplates.formatNumber(user.balance)}** 🥕`)]
            }, message_dispatcher.PRIORITY.HIGH);
        }

        // perform transaction
        await db_manager.updateUserBalance(user_id, guild_id, -amount);
        await db_manager.updateUserBalance(target_user.id, guild_id, amount);

        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.successMessage('Donation Successful!', `You have donated **${MessageTemplates.formatNumber(amount)}** 🥕 to **${target_user.username}**!`)]
        });
    }

    return message_dispatcher.reply(message, {
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    }, message_dispatcher.PRIORITY.HIGH);
}