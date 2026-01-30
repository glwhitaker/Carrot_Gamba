import { db_manager } from "../db/db_manager.js";
import { item_manager } from "../items/item_manager.js";
import { MessageFlags } from 'discord.js';
import { MessageTemplates } from "../utils/message_templates.js";

export async function handleOpen(args, message, usage)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        // get crate key from args
        if(args.length !== 1)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage(`Usage: \`${usage}\``)]
            });
        }

        const crate_key = args[0];
        const crate = item_manager.getCrate(crate_key);
        if(!crate)
        {
            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.errorMessage('Invalid crate. Use \`^inventory\` to see your crates.')]
            });
        }

        // get user items
        // const user_items = await item_manager.getUserItems(user_id, guild_id);
        // const user_crate = user_items.find(i => i.key === crate_key);
        // if(!user_crate || user_crate.quantity < 1)
        // {
        //     return message.reply({
        //         flags: MessageFlags.IsComponentsV2,
        //         components: [MessageTemplates.errorMessage(`You don't have a **${item_manager.getCrate(crate_key).name}** to open.`)]
        //     });
        // }

        // open crate
        const rewards = item_manager.rollCrate(crate.key);

        // give rewards to user
        for(const reward of rewards)
        {
            await item_manager.giveItemToUser(user_id, guild_id, reward, 1);
        }
        
        // remove crate from user's inventory
        await item_manager.consumeItemForUser(user_id, guild_id, crate.key, 1);
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}