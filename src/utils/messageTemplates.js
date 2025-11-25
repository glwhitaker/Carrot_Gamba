import { EmbedBuilder } from 'discord.js';
import { getCommandsByCategory } from '../commands/index.js';

// colors for different types of messages
export const COLORS = {
    PRIMARY: '#7289DA',
    SUCCESS: '#43B581',
    ERROR: '#F04747',
    INFO: '#4F545C',
    WARNING: '#FAA61A',
    GOLD: '#FFB636'
};

// common message templates
export class MessageTemplates {
    static getStandardFooter(type) {
        const icons = {
            balance: '🏦',
            leaderboard: '🌟',
            daily: '⏰',
            blackjack: '♠️',
            gambling: '🎲',
            error: '⚠️',
            success: '✅'
        };

        return { 
            text: `${icons[type] || '🥕'} Updated just now • Use ^help for commands`
        };
    }

    static balanceEmbed(username, balance) {
        const formattedBalance = this.formatNumber(balance) + ' 🥕';
        
        return new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🏦 Carrot Bank')
            .addFields(
                {
                    name: 'Account Holder',
                    value: `\`${username}\``,
                    inline: true
                },
                {
                    name: 'Carrots',
                    value: `\`\`\`${formattedBalance}\`\`\``,
                    inline: true
                },
                {
                    name: 'Quick Actions',
                    value: '`^daily` • `^gamba` • `^help`',
                    inline: false
                }
            )
            .setFooter(this.getStandardFooter('balance'))
            .setTimestamp();
    }

    static errorEmbed(message) {
        return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('Error')
        .setDescription(message)
        .setFooter(this.getStandardFooter('error'))
        .setTimestamp();
    }

    static successEmbed(title, description) {
        return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(title)
        .setDescription(description)
        .setFooter(this.getStandardFooter('success'))
        .setTimestamp();
    }

    static helpEmbed() {
        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle('🥕 Carrot Gamba Commands')
            .setFooter({ 
                text: 'Carrot Gamba Bot | Use ^help <command> for details on a specific command'
            })
            .setTimestamp();

        const categories = getCommandsByCategory();
        
        // Add fields for each category
        for (const [category, cmds] of Object.entries(categories)) {
            if (cmds.length === 0) continue;
            
            // Format the category name properly
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            // Create command list for this category
            const commandList = cmds.map(cmd => {
                return `\`${cmd.usage}\` - ${cmd.description}`;
            }).join('\n');
            
            // Add the field
            embed.addFields({ name: `${this.getCategoryEmoji(category)} ${categoryName} Commands`, value: commandList });
            
            // Add a spacer between categories
            if (Object.keys(categories).indexOf(category) < Object.keys(categories).length - 1) {
                embed.addFields({ name: '\u200B', value: '\u200B' });
            }
        }
        
        return embed;
    }

    // Help embed for a specific category
    static categoryHelpEmbed(category, commands) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle(`${this.getCategoryEmoji(category)} ${categoryName} Commands`)
            .setFooter({ 
                text: 'Use ^help <command> for details on a specific command'
            })
            .setTimestamp();
        
        // Create a detailed list of commands
        for (const cmd of commands) {
            let description = cmd.description;
            if (cmd.aliases && cmd.aliases.length > 0) {
                description += `\nAliases: ${cmd.aliases.map(a => `\`^${a}\``).join(', ')}`;
            }
            
            embed.addFields({
                name: `\`${cmd.usage}\``,
                value: description
            });
        }
        
        return embed;
    }

    // Help embed for a specific command
    static commandHelpEmbed(commandName, command) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle(`Command: ^${commandName}`)
            .setDescription(command.description)
            .setFooter({ 
                text: 'Carrot Gamba Bot | Use ^help to see all commands'
            })
            .setTimestamp();
        
        // Add usage information
        embed.addFields({ name: 'Usage', value: `\`${command.usage}\`` });
        
        // Add aliases if any
        if (command.aliases && command.aliases.length > 0) {
            embed.addFields({
                name: 'Aliases',
                value: command.aliases.map(alias => `\`^${alias}\``).join(', ')
            });
        }
        
        // Add category
        embed.addFields({
            name: 'Category',
            value: command.category.charAt(0).toUpperCase() + command.category.slice(1)
        });
        
        return embed;
    }

    // Helper method to get emojis for categories
    static getCategoryEmoji(category) {
        const emojis = {
            'economy': '💰',
            'games': '🎮',
            'utility': '🛠️',
            'misc': '📌'
        };
        
        return emojis[category] || '📋';
    }

    static leaderboardEmbed(users) {
        // Define column widths
        const rankWidth = 5;
        const nameWidth = 14;
        const balanceWidth = 12;

        // Create template for consistent spacing
        const rowTemplate = (rank, name, balance) => 
            `${rank.padEnd(rankWidth)}` +
            `${name.padEnd(nameWidth)}` +
            `${balance.padStart(balanceWidth)}`;

        // Header and separator
        const header = rowTemplate('RANK', 'PLAYER', 'CARROTS');
        const separator = '─'.repeat(rankWidth + nameWidth + balanceWidth);

        // Format each user row
        const formatLeaderboard = users.map((user, index) => {
            const position = this.getPosition(index + 1);
            const username = user.username.length > nameWidth 
                ? user.username.slice(0, nameWidth - 2) + '..'
                : user.username;
            const balance = this.formatNumber(user.balance) + ' 🥕';
            return rowTemplate(position, username, balance);
        }).join('\n');

        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('🏆 Current Leaderboard')
            .setDescription(
                '```ansi\n' +
                '\u001b[1m' + header + '\u001b[0m\n' +
                separator + '\n' +
                formatLeaderboard +
                '\n```'
            )
            .setFooter(this.getStandardFooter('leaderboard'))
            .setTimestamp();
    }

    static allTimeLeaderboardEmbed(users) {
        // Define column widths
        const rankWidth = 5;
        const nameWidth = 14;
        const balanceWidth = 12;

        // Create template for consistent spacing
        const rowTemplate = (rank, name, balance) => 
            `${rank.padEnd(rankWidth)}` +
            `${name.padEnd(nameWidth)}` +
            `${balance.padStart(balanceWidth)}`;

        // Header and separator
        const header = rowTemplate('RANK', 'PLAYER', 'CARROTS');
        const separator = '─'.repeat(rankWidth + nameWidth + balanceWidth);

        // Format each user row
        const formatLeaderboard = users.map((user, index) => {
            const position = this.getPosition(index + 1);
            const username = user.username.length > nameWidth 
                ? user.username.slice(0, nameWidth - 2) + '..'
                : user.username;
            const balance = this.formatNumber(user.balance) + ' 🥕';
            return rowTemplate(position, username, balance);
        }).join('\n');

        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('🏆 All-Time Leaderboard')
            .setDescription(
                '```ansi\n' +
                '\u001b[1m' + header + '\u001b[0m\n' +
                separator + '\n' +
                formatLeaderboard +
                '\n```'
            )
            .setFooter(this.getStandardFooter('leaderboard'))
            .setTimestamp();
    }

    static getPosition(position) {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}`;
        }
    }

    static formatHand(hand, hideFirst = false) {
        if (hideFirst) {
            return hand.slice(1).map(card => `\` ${card.suit}${card.value} \``).join(' ');
        }
        return hand.map(card => `\` ${card.suit}${card.value} \``).join(' ');
    }

    static calculateHand(hand) {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === 'A') {
                aces += 1;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }

        // Handle aces
        for (let i = 0; i < aces; i++) {
            if (value + 11 <= 21) {
                value += 11;
            } else {
                value += 1;
            }
        }

        return value;
    }

    static blackjackEmbed(username, bet, dealerHand, playerHand, playerValue, hideDealer) {
        const dealerValue = hideDealer ? '?' : this.calculateHand(dealerHand);
        
        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('♠️ Blackjack Table')
            .setDescription(
                `**Bet:** ${bet} 🥕\n\n` +
                `**Dealer's Hand (${dealerValue})**\n\n` +
                `${this.formatHand(dealerHand, hideDealer)}\n\n` +
                `**${username}'s Hand (${playerValue})**\n\n` +
                `${this.formatHand(playerHand)}`
            )
            .setFooter(this.getStandardFooter('blackjack'))
            .setTimestamp();
    }

    static blackjackResultEmbed(username, bet, dealerHand, playerHand, result) {
        const dealerValue = this.calculateHand(dealerHand);
        const playerValue = this.calculateHand(playerHand);
        
        const resultMessages = {
            'win': `You won ${bet} 🥕`,
            'push': 'Push! Bet returned.',
            'loss': `You lost ${bet} 🥕.`,
            'timeout': 'Game ended due to inactivity. Bet returned.'
        };

        return new EmbedBuilder()
            .setColor(result === 'win' ? COLORS.SUCCESS : 
                     result === 'push' ? COLORS.WARNING : 
                     COLORS.ERROR)
            .setTitle('♠️ Blackjack Result')
            .setDescription(
                `**Dealer's Hand (${dealerValue})**\n\n` +
                `${this.formatHand(dealerHand)}\n\n` +
                `**${username}'s Hand (${playerValue})**\n\n` +
                `${this.formatHand(playerHand)}\n\n` +
                `**Result:** ${resultMessages[result] || 'Error processing result'}`
            )
            .setFooter(this.getStandardFooter('blackjack'))
            .setTimestamp();
    }

    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static dailyRewardEmbed(username, amount) {
        return new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('🎁 Daily Reward Claimed!')
            .setFields(
                { name: 'Carrots Earned', value: `+${amount} 🥕` }
            )
            .setFooter(this.getStandardFooter('daily'))
            .setTimestamp();
    }

    static dailyCooldownEmbed(hours, minutes) {
        return new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('Daily Reward Cooldown ⏰')
            .setDescription(
                `Your next daily reward will be available in:\n` +
                `${hours} hours and ${minutes} minutes`
            )
            .setTimestamp();
    }

    static numberGuessStartEmbed(username, bet, multiplier) {
        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('🎲 Number Guess')
            .setDescription(
                `${username} bets ${bet} 🥕\n\n` +
                `Select a number between 1-10 to guess!\n` +
                `If you guess correctly, you win ${multiplier}x your bet!`
            )
            .setFooter(this.getStandardFooter('gambling'))
            .setTimestamp();
    }

    static numberGuessSelectEmbed(username, bet, guess) {
        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('🎲 Number Guess')
            .setDescription(
                `${username} bets ${bet} 🥕\n` +
                `Selected number: ${guess}\n\n` +
                `Picking number...`
            )
            .setFooter(this.getStandardFooter('gambling'))
            .setTimestamp();
    }

    static numberGuessResultEmbed(username, guess, winning, winnings) {
        const won = guess === winning;
        return new EmbedBuilder()
            .setColor(won ? COLORS.SUCCESS : COLORS.ERROR)
            .setTitle(won ? '🎉 Winner!' : '❌ Not quite')
            .setDescription(
                `${username}'s guess: ${guess}\n` +
                `Winning number: ${winning}\n\n` +
                (won ? `You won ${winnings} 🥕` : 'Better luck next time')
            )
            .setFooter(this.getStandardFooter('gambling'))
            .setTimestamp();
    }

    static coinTossEmbed(username, bet, animation = null) {
        return new EmbedBuilder()
            .setColor(COLORS.GOLD)
            .setTitle('🎲 Coin Toss')
            .setDescription(
                `**Player:** ${username}\n` +
                `**Bet:** ${bet} 🥕\n\n` +
                `${animation ? `${animation}` : 'Flipping coin...'}`
            )
            .setFooter(this.getStandardFooter('gambling'))
            .setFooter(this.getStandardFooter('gambling'))
            .setTimestamp();
    }

    static coinTossResultEmbed(username, bet, won) {
        return new EmbedBuilder()
            .setColor(won ? COLORS.SUCCESS : COLORS.ERROR)
            .setTitle(won ? '🎉 You Won!' : '❌ You Lost!')
            .setDescription(
                `**Player:** ${username}\n` +
                `**Bet:** ${bet} 🥕\n\n` +
                `**Result:** ${won ? `You won ${bet} 🥕` : `You lost ${bet} 🥕`}`
            )
            .setFooter(this.getStandardFooter('gambling'))
            .setTimestamp();
    }

    static personalStatsEmbed(username, stats, history) {
        const winRate = stats.total_games_played > 0 
            ? ((stats.total_games_won / stats.total_games_played) * 100).toFixed(1)
            : '0.0';

        // Define column widths for stats table
        const statNameWidth = 20;
        const statValueWidth = 15;

        // Create template for consistent spacing
        const rowTemplate = (name, value) => 
            `${name.padEnd(statNameWidth)}${value.padStart(statValueWidth)}`;

        // Format stats table
        const statsTable = [
            rowTemplate('Games Played:', stats.total_games_played.toString()),
            rowTemplate('Games Won:', stats.total_games_won.toString()),
            rowTemplate('Games Lost:', stats.total_games_lost.toString()),
            rowTemplate('Win Rate:', `${winRate}%`),
            rowTemplate('Total Won:', this.formatNumber(stats.total_money_won) + ' 🥕'),
            rowTemplate('Total Lost:', this.formatNumber(stats.total_money_lost) + ' 🥕'),
            rowTemplate('Highest Balance:', this.formatNumber(stats.highest_balance) + ' 🥕'),
            rowTemplate('Biggest Win:', this.formatNumber(stats.highest_single_win) + ' 🥕'),
            rowTemplate('Biggest Loss:', this.formatNumber(stats.highest_single_loss) + ' 🥕')
        ].join('\n');

        // Define column widths for history table
        const gameWidth = 12;
        const betWidth = 10;
        const resultWidth = 8;
        const payoutWidth = 12;

        // Create template for history table
        const historyRowTemplate = (game, bet, result, payout) => 
            `${game.padEnd(gameWidth)}${bet.padStart(betWidth)}${result.padStart(resultWidth)}${payout.padStart(payoutWidth)}`;

        // Format history table
        const historyHeader = historyRowTemplate('GAME', 'BET', 'RESULT', 'PAYOUT');
        const historySeparator = '─'.repeat(gameWidth + betWidth + resultWidth + payoutWidth);
        const historyRows = history.map(game => 
            historyRowTemplate(
                game.game_name,
                this.formatNumber(game.bet_amount) + ' 🥕',
                game.result,
                this.formatNumber(game.payout) + ' 🥕'
            )
        ).join('\n');

        return new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`📊 ${username}'s Gambling Stats`)
            .addFields(
                {
                    name: 'Overall Statistics',
                    value: '```ansi\n' + 
                        '\u001b[1m' + statsTable + '\u001b[0m\n' +
                        '```'
                },
                {
                    name: 'Recent Games (Last 10)',
                    value: '```ansi\n' +
                        '\u001b[1m' + historyHeader + '\u001b[0m\n' +
                        historySeparator + '\n' +
                        historyRows + '\n' +
                        '```'
                }
            )
            .setFooter(this.getStandardFooter('stats'))
            .setTimestamp();
    }

    static allGamesStatsEmbed(gameStats) {
        // Define column widths
        const gameWidth = 12;
        const gamesWidth = 8;
        const winRateWidth = 10;
        const wageredWidth = 15;

        // Create template for consistent spacing
        const rowTemplate = (game, games, winRate, wagered) => 
            `${game.padEnd(gameWidth)}${games.padStart(gamesWidth)}${winRate.padStart(winRateWidth)}${wagered.padStart(wageredWidth)}`;

        // Header and separator
        const header = rowTemplate('GAME', 'GAMES', 'WIN RATE', 'WAGERED');
        const separator = '─'.repeat(gameWidth + gamesWidth + winRateWidth + wageredWidth);

        // Format each game row
        const gamesTable = gameStats.map(game => {
            const winRate = game.total_games_played > 0
                ? ((game.total_games_won / game.total_games_played) * 100).toFixed(1)
                : '0.0';
            
            return rowTemplate(
                game.game_name,
                game.total_games_played.toString(),
                `${winRate}%`,
                this.formatNumber(game.total_money_wagered) + ' 🥕'
            );
        }).join('\n');

        return new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle('🎲 Game Statistics')
            .setDescription('```ansi\n' +
                '\u001b[1m' + header + '\u001b[0m\n' +
                separator + '\n' +
                gamesTable + '\n' +
                '```'
            )
            .setFooter(this.getStandardFooter('stats'))
            .setTimestamp();
    }

    static specificGameStatsEmbed(gameName, stats) {
        const winRate = stats.total_games_played > 0
            ? ((stats.total_games_won / stats.total_games_played) * 100).toFixed(1)
            : '0.0';

        // Define column widths
        const statNameWidth = 20;
        const statValueWidth = 15;

        // Create template for consistent spacing
        const rowTemplate = (name, value) => 
            `${name.padEnd(statNameWidth)}${value.padStart(statValueWidth)}`;

        // Format stats table
        const statsTable = [
            rowTemplate('Total Games:', stats.total_games_played.toString()),
            rowTemplate('Games Won:', stats.total_games_won.toString()),
            rowTemplate('Games Lost:', stats.total_games_lost.toString()),
            rowTemplate('Win Rate:', `${winRate}%`),
            rowTemplate('Total Wagered:', this.formatNumber(stats.total_money_wagered) + ' 🥕'),
            rowTemplate('Total Won:', this.formatNumber(stats.total_money_won) + ' 🥕'),
            rowTemplate('Total Lost:', this.formatNumber(stats.total_money_lost) + ' 🥕')
        ].join('\n');

        return new EmbedBuilder()
            .setColor(COLORS.PRIMARY)
            .setTitle(`🎲 ${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Statistics`)
            .setDescription('```ansi\n' +
                '\u001b[1m' + statsTable + '\u001b[0m\n' +
                '```'
            )
            .setFooter(this.getStandardFooter('stats'))
            .setTimestamp();
    }

    static weeklyRewardEmbed(username, amount) {
        return new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('🎁 Weekly Reward Claimed!')
            .setFields(
                { name: 'Carrots Earned', value: `+${amount} 🥕` }
            )
            .setFooter(this.getStandardFooter('weekly'))
            .setTimestamp();
    }

    static weeklyCooldownEmbed(days, hours) {
        return new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle('Weekly Reward Cooldown ⏰')
            .setDescription(
                `Your next weekly reward will be available in:\n` +
                `${days} days and ${hours} hours`
            )
            .setTimestamp();
    }
}