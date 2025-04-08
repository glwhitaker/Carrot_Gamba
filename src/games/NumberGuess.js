import { Game } from './Game.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export class NumberGuess extends Game {
    constructor() {
        super('numberguess', 10); // name and minimum bet
        this.multiplier = 10;
        this.maxNumber = 10;
        this.minNumber = 1;
    }

    parseBet(args) {
        const guess = parseInt(args[1]); // First arg after game name is guess
        const bet = parseInt(args[2]);   // Second arg is bet

        if (isNaN(guess) || guess < this.minNumber || guess > this.maxNumber) {
            return { error: `Please guess a number between ${this.minNumber} and ${this.maxNumber}!` };
        }
        if (isNaN(bet) || !this.validateBet(bet)) {
            return { error: `Bet must be at least ${this.minBet} carrots` };
        }
        return { bet, guess };
    }

    async play(message, bet) {
        try {
            const guess = parseInt(message.content.split(' ')[2]); // Get guess from command
            // console.log(guess);
            // Validate guess
            if (isNaN(guess) || guess < this.minNumber || guess > this.maxNumber) {
                return message.reply({
                    embeds: [MessageTemplates.errorEmbed(`Please guess a number between ${this.minNumber} and ${this.maxNumber}!`)]
                });
            }

            // Build suspense
            const suspenseMsg = await message.reply({
                embeds: [MessageTemplates.numberGuessStartEmbed(message.author.username, bet, guess)]
            });

            // Wait for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate winning number
            const winningNumber = Math.floor(Math.random() * this.maxNumber) + 1;
            const won = guess === winningNumber;
            const winnings = won ? bet * (this.multiplier - 1) : -bet;

            // Update game stats before showing final result
            await this.updateGameStats(message.author.id, message.guild.id, bet, won ? 'win' : 'loss', won ? winnings + bet : winnings);

            // Update message with result
            await suspenseMsg.edit({
                embeds: [MessageTemplates.numberGuessResultEmbed(
                    message.author.username,
                    guess,
                    winningNumber,
                    won ? bet * this.multiplier : 0
                )]
            });

            return winnings;

        } catch (error) {
            console.error('Error in number guess game:', error);
            return 0;
        }
    }

    getHelpMessage() {
        return {
            name: 'Number Guess',
            value: `Guess a number between ${this.minNumber}-${this.maxNumber} to win ${this.multiplier}x your bet!\n` +
                  `Usage: \`^gamba numberguess <number> <bet>\`\n` +
                  `Example: \`^gamba numberguess 5 100\``
        };
    }
}
