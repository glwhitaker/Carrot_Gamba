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

        for(const item of user_items)
        {
            // determine if crate or item
            const crate = item_manager.getCrate(item.key);
            if(crate)
            {
                item.name = crate.name;
                item.type = 'crate';
            }
            else
            {
                // get metadata from item manager
                const item_meta = item_manager.getItem(item.key);
                item.name = item_meta.name;
                item.type = 'item';
            }
        }
        
        const active_arr = [];
        for(const key in active_items)
        {
            const item_meta = item_manager.getItem(key);
            active_arr.push({
                key: key,
                name: item_meta.name,
                quantity: active_items[key]
            });
        }

        return message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.inventoryMessage(user, user_items, active_arr)]
        });
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}