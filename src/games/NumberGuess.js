import { Game } from './Game.js';
import { MessageTemplates } from '../utils/messageTemplates.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class NumberGuess extends Game {
    constructor() {
        super('numberguess', 10); // name and minimum bet
        this.multiplier = 10;
        this.maxNumber = 10;
        this.minNumber = 1;
    }

    parseBet(args) {
        // Check if the bet argument is 'max' before parsing
        if (args[1] === 'max') {
            return { bet: 'max' }; // Return 'max' as a special value
        }
        
        const bet = parseInt(args[1]);   // First arg is bet
        if (isNaN(bet) || !this.validateBet(bet)) {
            return { error: `Bet must be at least ${this.minBet} carrots` };
        }
        return { bet };
    }

    createNumberButtons() {
        const rows = [
            new ActionRowBuilder(),
            new ActionRowBuilder()
        ];
        
        for (let i = this.minNumber; i <= this.maxNumber; i++) {
            const rowIndex = i <= 5 ? 0 : 1;
            rows[rowIndex].addComponents(
                new ButtonBuilder()
                    .setCustomId(`numberguess_${i}`)
                    .setLabel(i.toString())
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        return rows;
    }

    async play(message, bet) {
        try {
            // Send initial message with number buttons
            const initialMsg = await message.reply({
                embeds: [MessageTemplates.numberGuessStartEmbed(message.author.username, bet, this.multiplier)],
                components: this.createNumberButtons()
            });

            // Wait for button interaction
            const filter = i => i.user.id === message.author.id;
            const collector = initialMsg.createMessageComponentCollector({ filter, time: 30000 });

            return new Promise((resolve) => {
                collector.on('collect', async (interaction) => {
                    const guess = parseInt(interaction.customId.split('_')[1]);
                    
                    // Disable all buttons
                    const disabledButtons = this.createNumberButtons();
                    disabledButtons.forEach(row => {
                        row.components.forEach(button => button.setDisabled(true));
                    });
                    await initialMsg.edit({ components: disabledButtons });

                    // Build suspense
                    await interaction.deferReply();
                    await interaction.editReply({
                        embeds: [MessageTemplates.numberGuessSelectEmbed(message.author.username, bet, guess)]
                    });
                    const suspenseMsg = await interaction.fetchReply();

                    // Wait for dramatic effect
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Generate winning number
                    const winningNumber = Math.floor(Math.random() * this.maxNumber) + 1;
                    const won = guess === winningNumber;
                    const winnings = won ? bet * (this.multiplier - 1) : -bet;

                    console.log('Calling updateGameStats with bet:', bet, typeof bet);
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

                    collector.stop();
                    resolve(winnings);
                });

                collector.on('end', (collected) => {
                    if (collected.size === 0) {
                        // Disable buttons if no selection was made
                        const disabledButtons = this.createNumberButtons();
                        disabledButtons.forEach(row => {
                            row.components.forEach(button => button.setDisabled(true));
                        });
                        initialMsg.edit({ components: disabledButtons });
                        resolve(0);
                    }
                });
            });

        } catch (error) {
            console.error('Error in number guess game:', error);
            return 0;
        }
    }

    getHelpMessage() {
        return {
            name: 'Number Guess',
            value: `Guess a number between ${this.minNumber}-${this.maxNumber} to win ${this.multiplier}x your bet!\n` +
                  `Usage: \`^gamba numberguess <bet|max>\`\n` +
                  `Example: \`^gamba numberguess 100\` or \`^gamba numberguess max\``
        };
    }
}
