import { getDatabase, isUserEnrolled, updateUserBalance } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { DAILY_AMOUNT, DAILY_COOLDOWN_MS } from '../utils/constants.js';

export async function handleDaily(message) {
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
            `SELECT strftime('%s', last_daily_claim) as last_claim_unix 
             FROM users WHERE user_id = ? AND guild_id = ?`,
            [message.author.id, message.guild.id]
        );

        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const lastClaim = user.last_claim_unix ? parseInt(user.last_claim_unix) : 0;
        const timeElapsed = (now - lastClaim) * 1000; // Convert to milliseconds for comparison

        // // Debug logging
        // console.log('Debug time values:');
        // console.log('Now:', new Date(now * 1000).toISOString());
        // console.log('Last claim:', new Date(lastClaim * 1000).toISOString());
        // console.log('Time elapsed (ms):', timeElapsed);
        // console.log('Cooldown (ms):', DAILY_COOLDOWN_MS);

        // check if enough time has passed
        if (timeElapsed < DAILY_COOLDOWN_MS) {
            const timeRemaining = DAILY_COOLDOWN_MS - timeElapsed;
            const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
            const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

            return message.reply({
                embeds: [MessageTemplates.dailyCooldownEmbed(hoursRemaining, minutesRemaining)]
            });
        }

        // First update the last claim time using Unix timestamp
        await db.run(
            `UPDATE users 
             SET last_daily_claim = datetime(?, 'unixepoch')
             WHERE user_id = ? AND guild_id = ?`,
            [now, message.author.id, message.guild.id]
        );

        // Then award daily carrots
        const result = await updateUserBalance(
            message.author.id,
            message.guild.id,
            DAILY_AMOUNT,
            'Daily reward'
        );

        if (!result.success) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed(result.error)]
            });
        }

        return message.reply({
            embeds: [MessageTemplates.dailyRewardEmbed(message.author.username, DAILY_AMOUNT)]
        });
        
    } catch (error) {
        console.error('Error handling daily command:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Error processing daily reward.')] 
        });
    }
}
