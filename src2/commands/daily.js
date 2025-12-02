import { db_manager } from '../db/db_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { MessageFlags } from 'discord.js';

export async function handleDaily(args, message)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;
    const current_time = new Date();

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        const last_claim = new Date(user.last_daily_claim);
        const time_diff = current_time - last_claim;

        if(time_diff > config.DAILY_COOLDOWN_MS)
        {
            // update last claim in db
            await db_manager.updateLastDailyClaim(user_id, guild_id, current_time.toISOString());
            // award daily gift
        }

    }
}