import { item_manager } from "../items/item_manager.js";
import { db_manager } from "../db/db_manager.js";
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from "../utils/message_templates.js";

export async function handleUse(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;
    const current_time = new Date();

    // see if user has the item
    if(args.length !== 1)
    {
        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
        });
    }

    const user = await db_manager.getUser(user_id, guild_id);
    
    if(user)
    {
        // get items from user's inventory
        const user_items = await item_manager.getUserItems(user_id, guild_id);

        const item_key = args[0].toLowerCase();
        const item = user_items.find(i => i.key === item_key);

        // see if valid item
        if(!item_manager.getItem(item_key))
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`Invalid item. Use \`^inventory\` to see your items.`)]
            });
        }

        if(!item || item.quantity <= 0)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`You don't have a **${item_manager.getItem(item_key).name}** to use.`)]
            });
        }

        // first see if item is already active for user
        const active_items = await item_manager.getActiveItemsForUser(user_id, guild_id);
        if(active_items[item_key])
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`You have already activated **${item_manager.getItem(item_key).name}**.`)]
            });
        }

        // add item effect to current activated items for this user
        if(!item_manager.current_items_activated[`${guild_id}-${user_id}`])
            item_manager.current_items_activated[`${guild_id}-${user_id}`] = {};

        item_manager.current_items_activated[`${guild_id}-${user_id}`][item_key] += item_manager.getItem(item_key).max_uses || 1;

        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.itemActivatedMessage(user, item.key)]
        })
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}