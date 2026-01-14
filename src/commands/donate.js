import { db_manager } from '../db/db_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleDonate(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;

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

        // parse user mention
        const target_user = message.mentions.users.first();
        const amount = parseInt(args[1]);

        // validations
        if(!target_user)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Please mention a user to donate to!')]
            })
        }

        const t_user = await db_manager.getUser(target_user.id, guild_id);

        if(!t_user)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`${target_user.username} needs to \`^enroll\` first!`)]
            });
        }

        if(target_user.id === user_id)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('You cannot donate to yourself!')]
            });
        }

        if(isNaN(amount) || amount <= 0)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Please enter a valid amount to donate!')]
            });
        }

        if(user.balance < amount)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`You don't have enough carrots!\nYour balance: **${MessageTemplates.formatNumber(user.balance)}** 🥕`)]
            });
        }

        // perform transaction
        await db_manager.updateUserBalance(user_id, guild_id, -amount);
        await db_manager.updateUserBalance(target_user.id, guild_id, amount);

        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.successMessage('Donation Successful!', `You have donated **${MessageTemplates.formatNumber(amount)}** 🥕 to **${target_user.username}**!`)]
        });
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}