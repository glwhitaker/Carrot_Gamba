import { getAllTimeLeaderboard, getLeaderboard } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleLeaderboard(message) {
    try {
        const users = await getLeaderboard(message.guild.id);
        const all_time_users = await getAllTimeLeaderboard(message.guild.id);

        if(!users.length) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed('You need to `^enroll` first!')] 
            });
        }

        return message.reply({ 
            embeds: [MessageTemplates.leaderboardEmbed(users), MessageTemplates.allTimeLeaderboardEmbed(all_time_users)]
        });
    } catch (error) {
        console.error('Error displaying leaderboard:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Sorry, there was an error displaying the leaderboard.')]
        });
    }
}
