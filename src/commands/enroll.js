import { getDatabase } from '../database/db.js';
import { STARTING_BALANCE } from '../utils/constants.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { enrollmentCache } from '../utils/enrollmentCache.js';

export async function handleEnroll(message) {
    const db = getDatabase();

    // get user information from discord message
    const userId = message.author.id;
    const guildId = message.guild.id;
    const username = message.author.username;
    const currentTime = new Date().toISOString();

    try {
        // check if the user is already enrolled
        const existingUser = await db.get('SELECT * FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);

        if (existingUser) {
            return message.reply({ 
                embeds: [MessageTemplates.balanceEmbed(
                    username, 
                    MessageTemplates.formatNumber(existingUser.balance)
                )]
            });
        }

        // existing user not found, enroll them
        await db.run(
            `INSERT INTO users (
                user_id,
                guild_id,
                username,
                balance,
                enrollment_date,
                last_message_date
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                guildId,
                username,
                STARTING_BALANCE,
                currentTime,
                currentTime
            ]
        )

        // update cache
        enrollmentCache.set(userId, guildId, true);

        return message.reply({ 
            embeds: [MessageTemplates.successEmbed(
                'Welcome!',
                `You have been enrolled with ${MessageTemplates.formatNumber(STARTING_BALANCE)} carrots! 🥕`
            )]
        });

    } catch (error) {
        console.error('Error in enroll command:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Sorry, there was an error processing your enrollment.')]
        });
    }
    
}