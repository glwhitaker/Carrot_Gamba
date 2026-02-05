import { db_manager } from '../db/db_manager.js';
import config from '../config.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleWeekly(args, message)
{
    const user_id = message.author.id;
    const guild_id = message.guild.id;
    const username = message.author.username;
    const current_time = new Date();

    const user = await db_manager.getUser(user_id, guild_id);

    if(user)
    {
        const last_claim = new Date(user.last_weekly_claim);
        const time_diff = current_time - last_claim;

        if(time_diff > config.WEEKLY_COOLDOWN_MS)
        {
            // update last claim in db
            await db_manager.updateLastWeeklyClaim(user_id, guild_id, current_time.toISOString());

            // award weekly gift
            await db_manager.updateUserBalance(user_id, guild_id, config.WEEKLY_AMOUNT * (1 + parseInt(user.progression.passive_multiplier) / 100));

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.weeklyRewardMessage(username, config.WEEKLY_AMOUNT * (1 + parseInt(user.progression.passive_multiplier) / 100))],
                files: [{
                    attachment:'src/img/gift.png',
                    name:'gift.png'
                }]
            });
        }
        else
        {
            // find days, hours, and minutes remaining
            const time_remaining = config.WEEKLY_COOLDOWN_MS - time_diff;
            const days_remaining = Math.floor(time_remaining / (1000 * 60 * 60 * 24));
            const hours_remaining = Math.floor((time_remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes_remaining = Math.floor((time_remaining % (1000 * 60 * 60)) / (1000 * 60));
    

            return message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [MessageTemplates.weeklyCooldownMessage(days_remaining, hours_remaining, minutes_remaining)],
                files: [{
                    attachment:'src/img/clock.png',
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