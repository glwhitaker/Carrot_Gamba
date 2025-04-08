import { Game } from './Game.js';
import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import {MessageTemplates} from '../utils/messageTemplates.js';

export class BlackJack extends Game {
    constructor() {
        super('blackjack', 10);
        this.deck = [];
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    }

    parseBet(args) {
        const bet = parseInt(args[1]); // Blackjack just needs the bet amount
        if (isNaN(bet) || !this.validateBet(bet)) {
            return { error: `Bet must be at least ${this.minBet} carrots` };
        }
        return { bet };
    }

    createDeck() {
        this.deck = [];
        for (const suit of this.suits) {
            for (const value of this.values) {
                this.deck.push({ suit, value });
            }
        }

        // shuffle the deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        return this.deck.pop();
    }

    calculateHand(hand) {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value == 'A'){
                aces += 1;
            }
            else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            }
            else {
                value += parseInt(card.value);
            }
        }

        // handle aces
        for (let i = 0; i < aces; i++) {
            if (value + 11 <= 21) {
                value += 11
            }
            else {
                value += 1;
            }
        }
        return value;
    }

    formatHand(hand, hideFirst = false) {
        if (hideFirst) {
            return [`🎴`, ...hand.slice(1).map(card => `${card.suit}${card.value}`)].join(' ');
        }
        return hand.map(card => `${card.suit}${card.value}`).join(' ');
    }

    getGameButtons(disabled = false) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Hit')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Stand')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled)
            );
    }

    async play(message, bet) {
        this.createDeck();
        const playerHand = [this.drawCard(), this.drawCard()];
        const dealerHand = [this.drawCard(), this.drawCard()];

        const gameEmbed = MessageTemplates.blackjackEmbed(
            message.author.username,
            bet,
            dealerHand,
            playerHand,
            this.calculateHand(playerHand),
            true
        );

        const gameMessage = await message.reply({
            embeds: [gameEmbed],
            components: [this.getGameButtons()]
        });

        try {
            const filter = i => i.user.id === message.author.id;
            const collector = gameMessage.createMessageComponentCollector({
                filter,
                time: 30000 // 30 seconds to make a move
            });

            return new Promise((resolve) => {
                collector.on('collect', async (interaction) => {
                    try {
                        if (interaction.customId === 'hit') {
                            playerHand.push(this.drawCard());
                            const playerValue = this.calculateHand(playerHand);

                            if (playerValue > 21) {
                                // Disable buttons before stopping collector
                                await interaction.update({
                                    embeds: [MessageTemplates.blackjackEmbed(
                                        message.author.username,
                                        bet,
                                        dealerHand,
                                        playerHand,
                                        playerValue,
                                        true
                                    )],
                                    components: [this.getGameButtons(true)] // Disable buttons
                                });
                                collector.stop('bust');
                                return;
                            }

                            await interaction.update({
                                embeds: [MessageTemplates.blackjackEmbed(
                                    message.author.username,
                                    bet,
                                    dealerHand,
                                    playerHand,
                                    playerValue,
                                    true
                                )],
                                components: [this.getGameButtons()]
                            });
                        }
                        else if (interaction.customId === 'stand') {
                            // Disable buttons before processing dealer's turn
                            await interaction.update({
                                embeds: [gameEmbed],
                                components: [this.getGameButtons(true)] // Disable buttons
                            });
                            collector.stop('stand');
                        }
                    } catch (error) {
                        console.error('Error handling interaction:', error);
                        collector.stop('error');
                    }
                });

                collector.on('end', async (collected, reason) => {
                    let dealerValue = this.calculateHand(dealerHand);
                    let playerValue = this.calculateHand(playerHand);
                    let result;
                    let winnings;

                    try {
                        if (reason === 'error') {
                            await gameMessage.edit({
                                embeds: [MessageTemplates.errorEmbed('An error occurred during the game. Your bet has been returned.')],
                                components: []
                            });
                            return resolve(0);
                        }

                        if (reason === 'bust') {
                            result = 'loss';  // Changed from 'bust' to 'loss' to match our stat tracking
                            winnings = -bet;
                        } else if (reason === 'stand') {
                            // Dealer draws all cards at once
                            while (dealerValue < 17) {
                                dealerHand.push(this.drawCard());
                                dealerValue = this.calculateHand(dealerHand);
                            }

                            if (dealerValue > 21 || playerValue > dealerValue) {
                                result = 'win';
                                winnings = bet;
                            } else if (dealerValue > playerValue) {
                                result = 'loss';
                                winnings = -bet;
                            } else {
                                result = 'push';
                                winnings = 0;
                            }
                        } else {
                            result = 'timeout';
                            winnings = 0;
                        }

                        // Update game stats before showing final result
                        await this.updateGameStats(
                            message.author.id,
                            message.guild.id,
                            bet,
                            result,
                            winnings
                        );

                        // Show final result
                        await gameMessage.edit({
                            embeds: [MessageTemplates.blackjackResultEmbed(
                                message.author.username,
                                bet,
                                dealerHand,
                                playerHand,
                                result
                            )],
                            components: []
                        });

                        return resolve(winnings);
                    } catch (error) {
                        console.error('Error in game end:', error);
                        await gameMessage.edit({
                            embeds: [MessageTemplates.errorEmbed('An error occurred during the game. Your bet has been returned.')],
                            components: []
                        });
                        return resolve(0);
                    }
                });
            });
        } catch (error) {
            console.error('Error in blackjack game:', error);
            await message.reply({ 
                embeds: [MessageTemplates.errorEmbed('An error occurred during the game. Your bet has been returned.')]
            });
            return 0;
        }
    }
}