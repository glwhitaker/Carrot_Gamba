import config from '../config.js';
import { db_manager } from '../db/db_manager.js';

// This class tracks user activity for message and voice rewards
class ActivityTracker
{
    constructor()
    {
    }

    init(client)
    {
        // listener for messages for points
        client.on('messageCreate', async (message) =>
        {
            if(message.author.bot) return;

            if(message.content.startsWith(config.COMMAND_PREFIX)) return;

            // parse user and guild id
            const user_id = message.author.id;
            const guild_id = message.guild.id;

            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                // track message activity
                if(activity_tracker.isValidMessage(message.content) && activity_tracker.canEarnMessagePoints(user))
                {
                    const carrots = config.MESSAGE.POINTS * user.progression.passive_multiplier;
                    await db_manager.updateUserBalance(user_id, guild_id, carrots);
                }
            }

        });
    }

    isValidMessage(content)
    {
        if(content.length < config.MESSAGE.MIN_LENGTH)
            return false;
        
        return true;
    }

    canEarnMessagePoints(user)
    {
        const now = new Date();
        const last_message = new Date(user.last_message_date);
        const time_diff = now - last_message;

        if(time_diff < config.MESSAGE.COOLDOWN_MS)
            return false;

        db_manager.updateLastMessageDate(user, now.toISOString());

        return true;
    }
}

export const activity_tracker = new ActivityTracker();