import { gameManager } from '../games/gameManager.js';
import { getDatabase, isUserEnrolled, updateUserBalance } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleGamble(message, args) {
    try {
        const gameName = args[0];
        if(!gameName || args.length < 2) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed(
                    'Invalid command format.\n' +
                    `Available games: ${gameManager.listGames().join(', ')}`
                )]
            });
        }

        const game = gameManager.getGame(gameName);
        if(!game) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed(
                    `Invalid game. Available games: ${gameManager.listGames().join(', ')}`
                )]
            });
        }

        // Let each game parse its own bet amount and arguments
        const { bet, error } = game.parseBet(args);
        if (error) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed(error)]
            });
        }

        // check if user is enrolled
        if (!await isUserEnrolled(message.author.id, message.guild.id)) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed('You need to `^enroll` first!')] 
            });
        }

        // check if user has enough carrots
        const db = getDatabase();
        const user = await db.get(
            'SELECT balance FROM users WHERE user_id = ? AND guild_id = ?',
            [message.author.id, message.guild.id]
        );

        // Handle 'max' bet - set bet to user's full balance
        let finalBet = bet;
        if (bet === 'max') {
            finalBet = user.balance;
        }
        
        if (user.balance < finalBet) {
            return message.reply({ 
                embeds: [MessageTemplates.errorEmbed('You don\'t have enough carrots!')] 
            });
        }
        // play the game
        const winnings = await game.play(message, finalBet);

        // update user balance
        if (winnings !== null) {
            const result = await updateUserBalance(
                message.author.id,
                message.guild.id,
                winnings,
                `Gambling: ${gameName}`
            );
            
            if (!result.success) {
                return message.reply({ 
                    embeds: [MessageTemplates.errorEmbed(result.error)]
                });
            }
        }

    } catch (error) {
        console.error('Error in gamble command:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('An error occurred while gambling')] 
        });
    }
}
