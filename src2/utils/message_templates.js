import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, StringSelectMenuBuilder } from 'discord.js';
import { item_manager } from '../items/item_manager.js';
import { xp_manager } from '../user/xp_manager.js';
import { command_manager } from '../commands/command_manager.js';
import config from '../config.js';
// colors for different types of messages
const COLORS = {
    PRIMARY: 0x90D5FF,
    SUCCESS: 0x57F287,
    ERROR: 0xF04747,
    INFO: 0x4F545C,
    WARNING: 0xFAA61A,
    GOLD: 0xFFB636
};

const RARITY_COLORS = {
    COMMON:
    {
        HEX: 0xAAAAAA,
        ANSI: '\u001b[0;30m'
    },
    UNCOMMON:
    {
        HEX:0x87CEEB,
        ANSI: '\u001b[0;36m'
    },
    RARE:
    {
        HEX: 0x6495ED,
        ANSI: '\u001b[0;34m'
    },
    EPIC:
    {
        HEX: 0xDA70D6,
        ANSI: '\u001b[0;35m'
    },
    LEGENDARY:
    {
        HEX: 0xFFD700,
        ANSI: '\u001b[0;33m'
    },
    MYTHIC:
    {
        HEX: 0xFF6B6B,
        ANSI: '\u001b[0;31m'
    }
};

export class MessageTemplates
{
    static getStandardFooter()
    {
        return { 
            content: '-# [Carrot Gamba](https://github.com/glwhitaker/Carrot_Gamba)  |  Use ^help for commands',
        };
    }

    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    static getLevelColor(level)
    {
        const colors = [
            RARITY_COLORS.COMMON.HEX,
            RARITY_COLORS.UNCOMMON.HEX,
            RARITY_COLORS.RARE.HEX,
            RARITY_COLORS.EPIC.HEX,
            RARITY_COLORS.LEGENDARY.HEX,
            RARITY_COLORS.MYTHIC.HEX
        ];
        
        const color_index = Math.min(Math.floor((level - 1) / (100 / colors.length)), colors.length - 1);
        return colors[color_index];
    }

    static colorLevelText(text, level)
    {
        const colors = [
            RARITY_COLORS.COMMON.ANSI,
            RARITY_COLORS.UNCOMMON.ANSI,
            RARITY_COLORS.RARE.ANSI,
            RARITY_COLORS.EPIC.ANSI,
            RARITY_COLORS.LEGENDARY.ANSI,
            RARITY_COLORS.MYTHIC.ANSI
        ];

        const color_index = Math.min(Math.floor((level - 1) / (100 / colors.length)), colors.length - 1);
        const color = colors[color_index];
        const color_string = color + text + '\u001b[0m';
        return color_string;
    }

    static visibleLength(string)
    {
        const ANSI_REGEX = /\u001b\[[0-9;]*m/g;
        return string.replace(ANSI_REGEX, '').length;
    }

    static padEndAnsi(str, targetLength)
    {
        const len = this.visibleLength(str);
        if(len >= targetLength)
            return str;
        return str + ' '.repeat(targetLength - len);
    }

    static padStartAnsi(str, targetLength)
    {
        const len = this.visibleLength(str);
        if(len >= targetLength)
            return str;
        return ' '.repeat(targetLength - len) + str;
    }

    // regular error
    static errorMessage(message)
    {
        const header = new TextDisplayBuilder().setContent(`## Error`);
        const p = new TextDisplayBuilder().setContent(`>>> ${message}`);

        return new ContainerBuilder()
        .setAccentColor(COLORS.ERROR)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addTextDisplayComponents(this.getStandardFooter());
    }

    static successMessage(title, message)
    {
        const header = new TextDisplayBuilder().setContent(`## ${title}`);
        const p = new TextDisplayBuilder().setContent(`>>> ${message}`);

        return new ContainerBuilder()
        .setAccentColor(COLORS.SUCCESS)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addTextDisplayComponents(this.getStandardFooter());
    }

    static balanceMessage(username, balance)
    {
        const formatted_balance = this.formatNumber(balance) + ' 🥕';
        const spacer = new SeparatorBuilder().setDivider(false);

        const header = new TextDisplayBuilder().setContent('# Carrot Bank');
        const account_field = new TextDisplayBuilder().setContent(`>>> **Account Holder**\n\`${username}\``);
        const balance_field = new TextDisplayBuilder().setContent(`### Carrots \`\`\`${formatted_balance}\`\`\``);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://image.png"
            }
        });

        const section = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            account_field
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.PRIMARY)
        .addSectionComponents(section)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(balance_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static dailyCooldownMessage(hours, minutes)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Daily Reward Cooldown');
        const p = new TextDisplayBuilder().setContent(`>>> Your next daily reward will be available in:\n**${hours}** hours and **${minutes}** minutes.`);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://clock.png"
            }
        });

        const section = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            p
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.WARNING)
        .addSectionComponents(section)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static dailyRewardMessage(username, amount)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Daily Reward Claimed!');
        const p = new TextDisplayBuilder().setContent(`### Carrots Earned:\n> +**${this.formatNumber(amount)}** 🥕`);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://gift.png"
            }
        });

        const section = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            p
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.SUCCESS)
        .addSectionComponents(section)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static weeklyCooldownMessage(days, hours, minutes)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Weekly Reward Cooldown');
        const p = new TextDisplayBuilder().setContent(`>>> Your next weekly reward will be available in:\n**${days}** days, **${hours}** hours, and **${minutes}** minutes.`);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://clock.png"
            }
        });

        const section = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            p
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.WARNING)
        .addSectionComponents(section)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static weeklyRewardMessage(username, amount)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Weekly Reward Claimed!');
        const p = new TextDisplayBuilder().setContent(`### Carrots Earned:\n> +**${this.formatNumber(amount)}** 🥕`);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://gift.png"
            }
        });

        const section = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            p
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.SUCCESS)
        .addSectionComponents(section)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static coinTossMessage(username, amount, frame)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# Coin Toss`);
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** bets\n**${this.formatNumber(amount)}** 🥕`);
        const coin = new TextDisplayBuilder().setContent(`# ═══════    ${frame ? frame : '🪙'}    ═══════`);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.GOLD)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(coin)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static coinTossResultMessage(username, bet_amount, result)
    {
        const won = result === 'win';
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# ${won ? 'You Win!' : 'You Lose!'}`);
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** bets\n**${this.formatNumber(bet_amount)}** 🥕`);
        const coin = new TextDisplayBuilder().setContent(`#  ═══════    🪙    ═══════`);

        const container = new ContainerBuilder()
        .setAccentColor(won ? COLORS.SUCCESS : COLORS.ERROR)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(coin)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static levelUpMessage(user, username, rewards)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const p = new TextDisplayBuilder().setContent(`> Congratulations <@${user.user_id}>!`);
        const lvl = new TextDisplayBuilder().setContent(`## **Level ${user.progression.level - 1}**   →   **Level ${user.progression.level}**`);

        let rewards_string = "";
        for(const reward of rewards)
        {
            rewards_string += `\n+ ${this.formatNumber(reward.amount)} ${reward.key === 'carrots' ? '🥕' : item_manager.getItem(reward.key).name}`;
        }

        const r_balance = new TextDisplayBuilder().setContent(`### Rewards\n\`\`\`${rewards_string}\`\`\``);
        
        const container = new ContainerBuilder()
        .setAccentColor(this.getLevelColor(user.progression.level))
        .addTextDisplayComponents(lvl)
        .addTextDisplayComponents(p)
        .addTextDisplayComponents(r_balance)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static userExperienceBar(user)
    {
        // build xp bar from level and required xp
        const level = user.progression.level;
        const current_xp = user.progression.xp;
        const required_xp = xp_manager.requiredXPForLevel(level);

        const bar_length = 27;
        const filled_length = Math.floor((current_xp / required_xp) * bar_length);
        const empty_length = bar_length - filled_length;

        const filled_bar = '▰'.repeat(filled_length);
        const empty_bar = '▱'.repeat(empty_length);
        const xp_string = level < config.MAX_LEVEL ? `${this.formatNumber(current_xp)} / ${this.formatNumber(required_xp)} XP` : 'MAX LEVEL';

        const xp_field = new TextDisplayBuilder().setContent(`\`\`\`ansi\n\u001b[1mLEVEL ${level}\u001b[0m\n${filled_bar}${empty_bar}\n${xp_string}\`\`\``);

        return xp_field;

    }

    static itemActivatedMessage(user, item_key)
    {
        const item = item_manager.getItem(item_key);
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Item Activated!');
        const p = new TextDisplayBuilder().setContent(`>>> **${item.name}**  ${item.icon}\n*${item.desc}*`);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.SUCCESS)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static itemUsedMessage(user, item_key)
    {
        const item = item_manager.getItem(item_key);
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Item Consumed!');
        const p = new TextDisplayBuilder().setContent(`>>> **${item.name}**  ${item.icon}`);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.INFO)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static userStatsMessage(user, stats)
    {
        // we have access to user info and progression on user object, and user stats passed in
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# Gamba Statistics\n>>> Statistics for <@${user.user_id}>`);

        // get user xp bar
        const xp_bar = this.userExperienceBar(user);

        // calc widths based on longest stat name and value, should add up to 52
        const total = 52;
        // get longest value
        const stat_value_width = Math.max(
            this.formatNumber(stats.highest_balance).length + 3,
            this.formatNumber(stats.total_money_won).length + 3,
            this.formatNumber(stats.total_money_lost).length + 3,
            this.formatNumber(stats.highest_single_win).length + 3,
            this.formatNumber(stats.highest_single_loss).length + 3,
            this.formatNumber(stats.total_games_played).length + 3,
            this.formatNumber(stats.total_games_won).length + 3,
            this.formatNumber(stats.total_games_lost).length + 3,
            ((stats.total_games_won / Math.max(stats.total_games_played, 1)) * 100).toFixed(2).length + 4
        );
        const stat_name_width = total - stat_value_width;

        const rowTemplate = (name, value) => `${name.padEnd(stat_name_width)}${value.padStart(stat_value_width)}`;

        const passive_mult_in_percent = '+' + ((user.progression.passive_multiplier - 1) * 100).toFixed(0) + '%';
        const user_table = [
            rowTemplate('\u001b[1mPassive Carrot Multiplier:\u001b[0m', passive_mult_in_percent)
        ].join('\n');

        const stats_table = [
            rowTemplate('\u001b[1mHighest Balance:\u001b[0m', this.formatNumber(stats.highest_balance) + ' 🥕'),
            rowTemplate('\u001b[1mTotal Carrots Won:\u001b[0m', this.formatNumber(stats.total_money_won) + ' 🥕'),
            rowTemplate('\u001b[1mTotal Carrots Lost:\u001b[0m', this.formatNumber(stats.total_money_lost) + ' 🥕'),
            rowTemplate('\u001b[1mBiggest Win:\u001b[0m', this.formatNumber(stats.highest_single_win) + ' 🥕'),
            rowTemplate('\u001b[1mBiggest Loss:\u001b[0m', this.formatNumber(stats.highest_single_loss) + ' 🥕')
            
        ].join('\n');

        const games_table = [
            rowTemplate('\u001b[1mTotal Games Played:\u001b[0m', this.formatNumber(stats.total_games_played)),
            rowTemplate('\u001b[1mTotal Wins:\u001b[0m', this.formatNumber(stats.total_games_won)),
            rowTemplate('\u001b[1mTotal Losses:\u001b[0m', this.formatNumber(stats.total_games_lost)),
            rowTemplate('\u001b[1mWin Rate:\u001b[0m', ((stats.total_games_won / Math.max(stats.total_games_played, 1)) * 100).toFixed(2) + '%')
        ].join('\n');

        const user_field = `\`\`\`ansi\n${user_table}\`\`\``;
        const stats_field = `\`\`\`ansi\n${stats_table}\`\`\``;
        const games_field = `\`\`\`ansi\n${games_table}\`\`\``;

        const user_text = new TextDisplayBuilder().setContent(user_field);
        const stats_text = new TextDisplayBuilder().setContent(stats_field);
        const games_text = new TextDisplayBuilder().setContent(games_field);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.INFO)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(
            xp_bar,
            user_text,
            stats_text,
            games_text
        )
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static appendGameResult(message, game_name, bet_amount, result, base_payout, payout, result_array)
    {
        const container = message.components[0];
        // remove existing footer (last component of array)
        container.components.pop();

        let cont_obj = new ContainerBuilder(container.toJSON());

        const won = result === 'win';
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('## Result:');

        // build result calculation
        const left_pad = 18;
        const right_pad = 18;
        const rowTemplate = (name, value) => `${name.padEnd(left_pad)}${value.padStart(right_pad)}`;
        let result_calc = rowTemplate('Base Payout', `${won ? `+ ${this.formatNumber(base_payout)}` : `- ${this.formatNumber(bet_amount)}`} 🥕`);
        for(const step of result_array)
        {
            result_calc += `\n${rowTemplate(step.label, step.calc + ' 🥕')}`;
        }
        result_calc += `\n${'-'.repeat(left_pad + right_pad)}\n`;
        result_calc += rowTemplate('Final Payout', `${won ? '+ ' : '- '}${this.formatNumber(Math.abs(payout))} 🥕`);
        let result_string = `\`\`\`ansi\n${result_calc}\n\`\`\``;
        const result_field = new TextDisplayBuilder().setContent(result_string);
        
        cont_obj
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(result_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return cont_obj;
    }

    static numberGuessMessage(username, bet_amount, min_number, max_number, hinted_numbers, disabled)
    {
        const multiplier = max_number;
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# Number Guess`);
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** bets\n**${this.formatNumber(bet_amount)}** 🥕`);

        // number of action rows needed (can have max 5 buttons per row)
        const total_numbers = max_number - min_number + 1;
        const buttons_per_row = 5;
        const total_rows = Math.ceil(total_numbers / buttons_per_row);
        
        let action_rows = [];
        for(let row = 0; row < total_rows; row++)
        {
            const action_row = new ActionRowBuilder();
            for(let col = 0; col < buttons_per_row; col++)
            {
                const number = min_number + row * buttons_per_row + col;
                if(number > max_number) break;

                const button = new ButtonBuilder()
                .setCustomId(`numberguess_${number}`)
                .setLabel(number.toString())
                .setDisabled(disabled);

                if(hinted_numbers.includes(number))
                {
                    button.setStyle(1);
                }
                else
                    button.setStyle(2);

                action_row.addComponents(button);
            }
            action_rows.push(action_row);
        }

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.GOLD)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addActionRowComponents(...action_rows)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static numberGuessResultMessage(username, bet_amount, min_number, max_number, result)
    {
        const won = result.result === 'win';
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# ${won ? 'You Win!' : 'You Lose!'}`);
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** bets\n**${this.formatNumber(bet_amount)}** 🥕`);

        // number of action rows needed (can have max 5 buttons per row)
        const total_numbers = max_number - min_number + 1;
        const buttons_per_row = 5;
        const total_rows = Math.ceil(total_numbers / buttons_per_row);
        
        let action_rows = [];
        for(let row = 0; row < total_rows; row++)
        {
            const action_row = new ActionRowBuilder();
            for(let col = 0; col < buttons_per_row; col++)
            {
                const number = min_number + row * buttons_per_row + col;
                if(number > max_number) break;

                const button = new ButtonBuilder()
                .setCustomId(`numberguess_${number}`)
                .setLabel(number.toString())
                .setDisabled(true)
                .setStyle(2);

                if(number === result.guessed_number)
                    button.setStyle(4);

                if(number === result.winning_number)
                    button.setStyle(3);

                action_row.addComponents(button);
            }
            action_rows.push(action_row);
        }

        const container = new ContainerBuilder()
        .setAccentColor(won ? COLORS.SUCCESS : COLORS.ERROR)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addActionRowComponents(...action_rows)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static helpMessage(selection)
    {
        // list all commands by category along with description, usage, and aliases
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Carrot Gamba Help');
        const p = new TextDisplayBuilder().setContent('>>> List of available commands:\n`<>` = required argument, `[]` = optional argument');


        const string_select = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Choose a category...');

        const categories = command_manager.getCategories();
        for(const category of categories)
        {
            string_select.addOptions({
                label: category.charAt(0).toUpperCase() + category.slice(1),
                value: category,
                default: selection === category
            });
        }
        const action_row = new ActionRowBuilder().addComponents(string_select);

        let command_list = '';
        const commands = command_manager.getCommandsByCategory(selection);
        for(const command in commands)
        {
            // capitalize first letter of command name
            const command_name = command.charAt(0).toUpperCase() + command.slice(1);
            command_list += `\n**${command_name}**\n> *${commands[command].description}*\n> Usage: \`${commands[command].usage}\`\n`;
        }

        const commands_field = new TextDisplayBuilder().setContent(command_list);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.PRIMARY)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addActionRowComponents(action_row)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(commands_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static leaderboardMessage(boards, selection)
    {
        const board = boards[selection];

        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# Leaderboard`);
        const string_select = new StringSelectMenuBuilder()
        .setCustomId('leaderboard_select')
        .setPlaceholder('Choose a leaderboard...')
        .addOptions(
            {label: 'Current Standings', value: 'balance', default: selection === 'balance'},
            {label: 'All-Time', value: 'highest_balance', default: selection === 'highest_balance'}
        );

        // define column widths
        const rank_width = 6;
        const name_width = 20;
        const balance_width = 20;
        const rowTemplate = (rank, name, balance) => `${this.padEndAnsi(rank, rank_width)}${this.padEndAnsi(name, name_width)}${this.padStartAnsi(balance, balance_width)}`;

        const table_header = rowTemplate('RANK', 'PLAYER', 'BALANCE');
        const separator_line = '─'.repeat(rank_width + name_width + balance_width);

        let table_content = '';
        let rank = 1;
        for(const entry of board)
        {
            const rank_str = rank == 1 ? '🥇' : rank == 2 ? '🥈' : rank == 3 ? '🥉' : rank.toString();

            // get only first 14 characters of username
            const display_name = entry.username.length > 14 ? entry.username.substring(0, 14) + '...' : entry.username;
            const level = this.colorLevelText(`Lv.${entry.progression.level}`, entry.progression.level);
            const combined_name = `${display_name} ${level}`;

            const balance = this.formatNumber(entry[selection]) + ' 🥕';
            
            table_content += rowTemplate(rank_str, combined_name, balance) + '\n';
        }

        const table_field = new TextDisplayBuilder().setContent(`\`\`\`ansi\n${table_header}\n${separator_line}\n${table_content}\`\`\``);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.GOLD)
        .addTextDisplayComponents(header)
        .addActionRowComponents(new ActionRowBuilder().addComponents(string_select))
        .addTextDisplayComponents(table_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static inventoryMessage(user, items)
    {
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent('# Item Inventory');
        const hint = new TextDisplayBuilder().setContent('>>> Type `^use <item_code>` to use an item from your inventory.');

        // show item name, code, quantity
        const name_width = 25;
        const code_width = 20;
        const qty_width = 10;
        const rowTemplate = (name, code, qty) => `${this.padEndAnsi(name, name_width)}${this.padEndAnsi(code, code_width)}${this.padStartAnsi(qty, qty_width)}`;

        const table_header = rowTemplate('ITEM NAME', 'ITEM CODE', 'QUANTITY');
        const separator_line = '─'.repeat(name_width + code_width + qty_width);

        let table_content = '';
        for(const item of items)
        {
            const display_name = item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name;
            const code = item.key;
            const quantity = this.colorLevelText(`x${item.quantity}`, 1);

            table_content += rowTemplate(display_name+item.icon, code, quantity) + '\n';
        }

        if(table_content === '')
            table_content = 'No items in inventory.';

        const table_field = new TextDisplayBuilder().setContent(`\`\`\`ansi\n${table_header}\n${separator_line}\n${table_content}\`\`\``);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.PRIMARY)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(hint)
        .addTextDisplayComponents(table_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }
}