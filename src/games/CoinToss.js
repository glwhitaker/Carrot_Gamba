import { Game } from './Game.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export class CoinToss extends Game {
    constructor() {
        super('cointoss', 10);
    }

    parseBet(args) {
        const bet = parseInt(args[1]); // CoinToss just needs the bet amount
        if (isNaN(bet) || !this.validateBet(bet)) {
            return { error: `Bet must be at least ${this.minBet} carrots` };
        }
        return { bet };
    }

    async play(message, bet) {
        const win = Math.random() >= 0.5;
        const winnings = win ? bet : -bet;

        // Send initial message
        const gameMessage = await message.reply({
            embeds: [MessageTemplates.coinTossEmbed(message.author.username, bet)]
        });

        // Animate the coin toss with improved animations
        const animations = ['💫', '🪙', '💫', '🪙', '💫'];
        for (const frame of animations) {
            await new Promise(resolve => setTimeout(resolve, 800));
            await gameMessage.edit({
                embeds: [MessageTemplates.coinTossEmbed(message.author.username, bet, frame)]
            });
        }

        // Update game stats before showing final result
        await this.updateGameStats(message.author.id, message.guild.id, bet, win ? 'win' : 'loss', winnings);

        // Show final result after a short pause
        await new Promise(resolve => setTimeout(resolve, 1000));
        await gameMessage.edit({
            embeds: [MessageTemplates.coinTossResultEmbed(message.author.username, bet, win)]
        });

        return winnings;
    }
}
