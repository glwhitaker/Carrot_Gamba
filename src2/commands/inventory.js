import { db_manager } from "../db/db_manager.js";
import { item_manager } from "../items/item_manager.js";
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from "../utils/message_templates.js";

export async function handleInventory(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        // get active items
        const active_items = await item_manager.getActiveItemsForUser(user_id, guild_id);
        // get all items
        const user_items = await db_manager.getUserItems(user_id, guild_id);

        // loop through user items and subtract active item quantities (divide by 5 if carrot surge)
        for(const item of user_items)
        {
            if(active_items[item.key])
            {
                if(item.key === 'carrot_surge')
                    item.quantity -= Math.ceil(active_items[item.key] / 5);
                else
                    item.quantity -= active_items[item.key];
            }

            // get metadata from item manager
            const item_meta = item_manager.getItem(item.key);
            item.name = item_meta.name;
            item.desc = item_meta.desc;
            item.icon = item_meta.icon;
        }

        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.inventoryMessage(user, user_items)]
        });
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}