import { db_manager } from '../db/db_manager.js';
import { item_manager } from '../items/item_manager.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export async function handleGive(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;

    const user = await db_manager.getUser(user_id, guild_id);

    if(!user)
    {
        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
        }, message_dispatcher.PRIORITY.HIGH);
    }

    if(args.length < 1 || args.length > 2)
    {
        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
        }, message_dispatcher.PRIORITY.HIGH);
    }

    const key = args[0].toLowerCase();
    const quantity = args[1] ? parseInt(args[1]) : 1;

    if(isNaN(quantity) || quantity < 1)
    {
        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage('Quantity must be a positive number.')]
        }, message_dispatcher.PRIORITY.HIGH);
    }

    // check if it's an item
    const item = item_manager.getItem(key);
    if(item)
    {
        await item_manager.giveItemToUser(user_id, guild_id, key, quantity);
        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.successMessage('Dev Give', `Added **${quantity}x ${item.name}** to your inventory.`)]
        });
    }

    // check if it's a crate
    const crate = item_manager.getCrate(key);
    if(crate)
    {
        await item_manager.giveCrateToUser(user_id, guild_id, key, quantity);
        return message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.successMessage('Dev Give', `Added **${quantity}x ${crate.name}** to your inventory.`)]
        });
    }

    return message_dispatcher.reply(message, {
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage(`Unknown item or crate: \`${key}\``)]
    }, message_dispatcher.PRIORITY.HIGH);
}