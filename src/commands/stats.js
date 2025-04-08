import { getDatabase } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleStats(message, args) {
    const db = getDatabase();
    
    try {
        // Check if first argument is a user mention
        let targetUser = message.author;
        let targetUsername = message.author.username;
        
        if (args.length > 0 && args[0].startsWith('<@') && args[0].endsWith('>')) {
            const userId = args[0].replace(/[<@!>]/g, '');
            const member = await message.guild.members.fetch(userId).catch(() => null);
            
            if (!member) {
                return message.reply({
                    embeds: [MessageTemplates.errorEmbed('User not found')]
                });
            }
            
            targetUser = member.user;
            targetUsername = member.user.username;
            args = args.slice(1); // Remove the mention from args
        }

        if (args.length === 0 || args[0] === 'me') {
            // Get personal stats
            const stats = await db.get(`
                SELECT * FROM player_stats 
                WHERE user_id = ? AND guild_id = ?
            `, [targetUser.id, message.guild.id]);

            if (!stats) {
                return message.reply({
                    embeds: [MessageTemplates.errorEmbed(`${targetUsername} is not enrolled in the carrot economy`)]
                });
            }

            // Get recent game history (last 10 games)
            const history = await db.all(`
                SELECT * FROM game_history 
                WHERE user_id = ? AND guild_id = ?
                ORDER BY timestamp DESC
                LIMIT 10
            `, [targetUser.id, message.guild.id]);

            return message.reply({
                embeds: [MessageTemplates.personalStatsEmbed(targetUsername, stats, history)]
            });
        } 
        else if (args[0] === 'games') {
            if (args.length === 1) {
                // Get all game stats
                const gameStats = await db.all(`
                    SELECT * FROM game_stats
                    ORDER BY total_games_played DESC
                `);

                return message.reply({
                    embeds: [MessageTemplates.allGamesStatsEmbed(gameStats)]
                });
            } 
            else {
                // Get specific game stats
                const gameName = args[1].toLowerCase();
                const gameStats = await db.get(`
                    SELECT * FROM game_stats
                    WHERE game_name = ?
                `, [gameName]);

                if (!gameStats) {
                    return message.reply({
                        embeds: [MessageTemplates.errorEmbed(`Game "${gameName}" not found`)]
                    });
                }

                return message.reply({
                    embeds: [MessageTemplates.specificGameStatsEmbed(gameName, gameStats)]
                });
            }
        }
        else {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('Invalid stats command. Use ^stats [me|@user], ^stats games, or ^stats games <game>')]
            });
        }
    } catch (error) {
        console.error('Error handling stats command:', error);
        return message.reply({
            embeds: [MessageTemplates.errorEmbed('An error occurred while fetching stats')]
        });
    }
}
