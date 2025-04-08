import { getDatabase, isUserEnrolled, updateUserBalance } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { WEEKLY_AMOUNT, WEEKLY_COOLDOWN_MS } from '../utils/constants.js';

export async function handleWeekly(message) {
    try {
        // check if user is enrolled
        if (!await isUserEnrolled(message.author.id, message.guild.id)) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('You need to `^enroll` first!')]
            });
        }

        const db = getDatabase();

        // get user's last claim time
        const user = await db.get(
            `SELECT strftime('%s', last_weekly_claim) as last_claim_unix 
             FROM users WHERE user_id = ? AND guild_id = ?`,
            [message.author.id, message.guild.id]
        );

        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const lastClaim = user.last_claim_unix ? parseInt(user.last_claim_unix) : 0;
        const timeElapsed = (now - lastClaim) * 1000; // Convert to milliseconds for comparison

        // check if enough time has passed
        if (timeElapsed < WEEKLY_COOLDOWN_MS) {
            const timeRemaining = WEEKLY_COOLDOWN_MS - timeElapsed;
            const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
            const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

            return message.reply({
                embeds: [MessageTemplates.weeklyCooldownEmbed(daysRemaining, hoursRemaining)]
            });
        }

        // First update the last claim time using Unix timestamp
        await db.run(
            `UPDATE users 
             SET last_weekly_claim = datetime(?, 'unixepoch')
             WHERE user_id = ? AND guild_id = ?`,
            [now, message.author.id, message.guild.id]
        );

        // Then award weekly carrots
        const result = await updateUserBalance(
            message.author.id,
            message.guild.id,
            WEEKLY_AMOUNT,
            'Weekly reward'
        );

        if (!result.success) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed(result.error)]
            });
        }

        return message.reply({
            embeds: [MessageTemplates.weeklyRewardEmbed(message.author.username, WEEKLY_AMOUNT)]
        });
        
    } catch (error) {
        console.error('Error handling weekly command:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Error processing weekly reward.')] 
        });
    }
}
