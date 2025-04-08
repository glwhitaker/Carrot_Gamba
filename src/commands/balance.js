import { getDatabase } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleBalance(message) {
    const db = getDatabase();
    const userID = message.author.id;
    const guildId = message.guild.id;

    try {
        const user = await db.get('SELECT balance FROM users WHERE user_id = ? AND guild_id = ?', [userID, guildId]);

        // check is user in enrolled
        if(!user) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('You need to `!enroll` first before checking your balance!')]
            });
        }

        // format balance with commas
        const formattedBalance = MessageTemplates.formatNumber(user.balance);

        return message.reply({ 
            embeds: [MessageTemplates.balanceEmbed(message.author.username, formattedBalance)]
        });
    } catch (error) {
        console.error('Error in balance command:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Sorry, there was an error checking your balance.')] 
        });
    }
}
