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
            await db_manager.updateUserBalance(user_id, guild_id, config.DAILY_AMOUNT);

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.dailyRewardMessage(username, config.DAILY_AMOUNT)],
                files: [{
                    attachment:'src2/img/gift.png',
                    name:'gift.png'
                }]
            });
        }
        else
        {
            // find hours and minutes remaining
            const time_remaining = config.DAILY_COOLDOWN_MS - time_diff;
            const hours_remaining = Math.floor(time_remaining / (1000 * 60 * 60));
            const minutes_remaining = Math.floor((time_remaining % (1000 * 60 * 60)) / (1000 * 60));

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.dailyCooldownMessage(hours_remaining, minutes_remaining)],
                files: [{
                    attachment:'src2/img/clock.png',
                    name:'clock.png'
                }]
            });
        }
    }

    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage('You need to `^enroll` first!')]
    });
}