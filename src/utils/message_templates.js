import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, StringSelectMenuBuilder, MediaGalleryBuilder, TextInputBuilder } from 'discord.js';
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
    COMMON:    { HEX: 0xAAAAAA, ANSI: '\u001b[0;30m' },
    UNCOMMON:  { HEX: 0x87CEEB, ANSI: '\u001b[0;36m' },
    RARE:      { HEX: 0x6495ED, ANSI: '\u001b[0;34m' },
    EPIC:      { HEX: 0xDA70D6, ANSI: '\u001b[0;35m' },
    LEGENDARY: { HEX: 0xFFD700, ANSI: '\u001b[0;33m' },
    MYTHIC:    { HEX: 0xFF6B6B, ANSI: '\u001b[0;31m' }
};

const RARITY_ORDER = [
    RARITY_COLORS.COMMON,
    RARITY_COLORS.UNCOMMON,
    RARITY_COLORS.RARE,
    RARITY_COLORS.EPIC,
    RARITY_COLORS.LEGENDARY,
    RARITY_COLORS.MYTHIC
];

export class MessageTemplates
{
    // ── Internal Helpers ─────────────────────────────────────────────

    static _spacer()
    {
        return new SeparatorBuilder().setDivider(false);
    }

    static _text(content)
    {
        return new TextDisplayBuilder().setContent(content);
    }

    static _thumbnail(url)
    {
        return new ThumbnailBuilder({ media: { url } });
    }

    // Appends trailing spacer + standard footer to a container and returns it.
    static _finalize(container)
    {
        return container
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this.getStandardFooter());
    }

    // Conditionally prepends the active-items icon header to a container.
    static _addActiveItems(container, user)
    {
        const active_items = item_manager.getActiveItemsForUser(user.user_id, user.guild_id);
        if (Object.keys(active_items).length > 0)
        {
            container.addTextDisplayComponents(this.getActiveItemsHeader(active_items));
        }
    }

    // Creates a container with accent color and optional active-items header.
    static _gameContainer(color, user)
    {
        const container = new ContainerBuilder().setAccentColor(color);
        this._addActiveItems(container, user);
        return container;
    }

    // Builds a SectionBuilder with header text, body text, and a thumbnail image.
    static _sectionWithThumbnail(headerText, bodyText, imageFile)
    {
        return new SectionBuilder()
            .addTextDisplayComponents(
                this._text(headerText),
                this._text(bodyText)
            )
            .setThumbnailAccessory(this._thumbnail(`attachment://${imageFile}`));
    }

    // Standard bet-info line used by all game messages.
    static _betText(user, amount)
    {
        return this._text(`>>> **${user.username}** bets\n**${this.formatNumber(amount)}** 🥕`);
    }

    // ── Public Utilities ─────────────────────────────────────────────

    static getStandardFooter()
    {
        return {
            content: '-# [Carrot Gamba](https://github.com/glwhitaker/Carrot_Gamba)  |  Use ^help for commands',
        };
    }

    static formatNumber(number)
    {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static getLevelColor(level)
    {
        const color_index = Math.min(Math.floor((level - 1) / (100 / RARITY_ORDER.length)), RARITY_ORDER.length - 1);
        return RARITY_ORDER[color_index].HEX;
    }

    static colorLevelText(text, level)
    {
        const color_index = Math.min(Math.floor((level - 1) / (100 / RARITY_ORDER.length)), RARITY_ORDER.length - 1);
        return RARITY_ORDER[color_index].ANSI + text + '\u001b[0m';
    }

    static getCrateColor(crate_key)
    {
        const crate_number = parseInt(crate_key.slice(1));
        return RARITY_ORDER[crate_number]?.HEX;
    }

    static visibleLength(string)
    {
        const ANSI_REGEX = /\u001b\[[0-9;]*m/g;
        return string.replace(ANSI_REGEX, '').length;
    }

    static padEndAnsi(string, target_length)
    {
        const len = this.visibleLength(string);
        if(len >= target_length)
            return string;
        return string + ' '.repeat(target_length - len);
    }

    static padMidAnsi(string, target_length)
    {
        const len = this.visibleLength(string);
        if(len >= target_length)
            return string;
        const total_padding = target_length - len;
        const left_padding = Math.floor(total_padding / 2);
        const right_padding = total_padding - left_padding;
        return ' '.repeat(left_padding) + string + ' '.repeat(right_padding);
    }

    static padStartAnsi(string, target_length)
    {
        const len = this.visibleLength(string);
        if(len >= target_length)
            return string;
        return ' '.repeat(target_length - len) + string;
    }

    static getActiveItemsHeader(active_items)
    {
        let header_string = '-# ';
        for(const item_key in active_items)
        {
            const item = item_manager.getItem(item_key);
            header_string += `${item.icon} `;
        }
        return {
            content: header_string
        }
    }

    static userExperienceBar(user)
    {
        const level = user.progression.level;
        const current_xp = user.progression.xp;
        const required_xp = xp_manager.requiredXPForLevel(level);

        const bar_length = 27;
        const filled_length = Math.floor((current_xp / required_xp) * bar_length);
        const empty_length = bar_length - filled_length;
        const filled_bar = '▰'.repeat(filled_length > 0 ? filled_length : 0);
        const empty_bar = '▱'.repeat(empty_length > 0 ? empty_length : 0);
        const xp_string = level < config.LEVELING.MAX_LEVEL ? `${this.formatNumber(current_xp)} / ${this.formatNumber(required_xp)} XP` : 'MAX LEVEL';

        return this._text(`\`\`\`ansi\n\u001b[1mLEVEL ${level}\u001b[0m\n${filled_bar}${empty_bar}\n${xp_string}\`\`\``);
    }

    // ── Generic Messages ─────────────────────────────────────────────

    static errorMessage(message)
    {
        return new ContainerBuilder()
            .setAccentColor(COLORS.ERROR)
            .addTextDisplayComponents(this._text(`## Error`))
            .addTextDisplayComponents(this._text(`>>> ${message}`))
            .addTextDisplayComponents(this.getStandardFooter());
    }

    static successMessage(title, message)
    {
        return new ContainerBuilder()
            .setAccentColor(COLORS.SUCCESS)
            .addTextDisplayComponents(this._text(`## ${title}`))
            .addTextDisplayComponents(this._text(`>>> ${message}`))
            .addTextDisplayComponents(this.getStandardFooter());
    }

    // ── Economy Messages ─────────────────────────────────────────────

    static balanceMessage(username, balance)
    {
        const formatted_balance = this.formatNumber(balance) + ' 🥕';

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.PRIMARY)
            .addSectionComponents(
                this._sectionWithThumbnail(
                    '# Carrot Bank',
                    `>>> **Account Holder**\n\`${username}\``,
                    'image.png'
                )
            )
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this._text(`### Carrots \`\`\`${formatted_balance}\`\`\``));
        return this._finalize(container);
    }

    static dailyCooldownMessage(hours, minutes)
    {
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.WARNING)
            .addSectionComponents(
                this._sectionWithThumbnail(
                    '# Daily Reward Cooldown',
                    `>>> Your next daily reward will be available in:\n**${hours}** hours and **${minutes}** minutes.`,
                    'clock.png'
                )
            );
        return this._finalize(container);
    }

    static dailyRewardMessage(username, amount)
    {
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.SUCCESS)
            .addSectionComponents(
                this._sectionWithThumbnail(
                    '# Daily Reward Claimed!',
                    `### Carrots Earned:\n> +**${this.formatNumber(amount)}** 🥕`,
                    'gift.png'
                )
            );
        return this._finalize(container);
    }

    static weeklyCooldownMessage(days, hours, minutes)
    {
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.WARNING)
            .addSectionComponents(
                this._sectionWithThumbnail(
                    '# Weekly Reward Cooldown',
                    `>>> Your next weekly reward will be available in:\n**${days}** days, **${hours}** hours, and **${minutes}** minutes.`,
                    'clock.png'
                )
            );
        return this._finalize(container);
    }

    static weeklyRewardMessage(username, amount)
    {
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.SUCCESS)
            .addSectionComponents(
                this._sectionWithThumbnail(
                    '# Weekly Reward Claimed!',
                    `### Carrots Earned:\n> +**${this.formatNumber(amount)}** 🥕`,
                    'gift.png'
                )
            );
        return this._finalize(container);
    }

    static donateMessage(username, target_username, amount)
    {
        return this.successMessage('Donation Successful!', `You have donated **${this.formatNumber(amount)}** 🥕 to **${target_username}**!`);
    }

    // ── Item Messages ────────────────────────────────────────────────

    static itemActivatedMessage(user, item_key)
    {
        const item = item_manager.getItem(item_key);
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.SUCCESS)
            .addTextDisplayComponents(this._text('# Item Activated!'))
            .addTextDisplayComponents(this._text(`>>> **${item.name}**  ${item.icon}\n*${item.desc}*`));
        return this._finalize(container);
    }

    static itemUsedMessage(user, item_key)
    {
        const item = item_manager.getItem(item_key);
        const container = new ContainerBuilder()
            .setAccentColor(COLORS.INFO)
            .addTextDisplayComponents(this._text('# Item Consumed!'))
            .addTextDisplayComponents(this._text(`>>> **${item.name}**  ${item.icon}`));
        return this._finalize(container);
    }

    static crateMessage(user, crate)
    {
        const image = new MediaGalleryBuilder()
            .addItems([{ media: { url: "attachment://crate.gif" } }]);

        const container = new ContainerBuilder()
            .setAccentColor(this.getCrateColor(crate.key))
            .addTextDisplayComponents(this._text(`## Opening Crate...`))
            .addTextDisplayComponents(this._text(`>>> **${user.username}** opens **${crate.name}**`))
            .addMediaGalleryComponents(image);
        return this._finalize(container);
    }

    static crateResultMessage(user, crate, items)
    {
        const image = new MediaGalleryBuilder()
            .addItems([{ media: { url: "attachment://crate.png" } }]);

        let item_table = '```ansi\n'
        for(const item in items)
        {
            const item_config = item_manager.getItem(items[item].key);
            const item_name = item_config.name;
            const quantity = items[item].quantity;
            item_table += `+ ${item_name} ${this.colorLevelText("x" + this.formatNumber(quantity), 1)}\n`;
        }
        item_table += '```';

        const container = new ContainerBuilder()
            .setAccentColor(this.getCrateColor(crate.key))
            .addTextDisplayComponents(this._text(`## Opening Crate...`))
            .addTextDisplayComponents(this._text(`>>> **${user.username}** opens **${crate.name}**`))
            .addMediaGalleryComponents(image)
            .addTextDisplayComponents(this._text(item_table));
        return this._finalize(container);
    }

    static inventoryMessage(user, items, active_items)
    {
        const name_width = 25;
        const code_width = 10;
        const qty_width = 10;
        const rowTemplate = (name, code, qty) => `${this.padEndAnsi(name, name_width)}${this.padStartAnsi(code, code_width)}${this.padStartAnsi(qty, qty_width)}`;
        const separator_line = '─'.repeat(name_width + code_width + qty_width);

        // active items table
        let active_content = '';
        for(const item of active_items)
        {
            const active_name = item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name;
            const uses = item.key === 'cs' ? Math.ceil(item.quantity / 5) : item.quantity;
            active_content += rowTemplate(active_name, item.key, this.colorLevelText(`x${uses}`, 1)) + '\n';
        }
        if(active_content === '')
            active_content = this.colorLevelText('No active items.', 1);

        // inventory table
        let table_content = '';
        for(const item of items)
        {
            let display_name;
            if(item.type === "crate")
                display_name = this.colorLevelText(item.name, parseInt(item.key.split("c")[1]) * 20);
            else
                display_name = item.name.length > 22 ? item.name.substring(0, 22) + '...' : item.name;

            table_content += rowTemplate(display_name, item.key, this.colorLevelText(`x${item.quantity}`, 1)) + '\n';
        }
        if(table_content === '')
            table_content = this.colorLevelText('No items in inventory.', 1);

        const active_header = rowTemplate('ACTIVE ITEMS', 'CODE', 'QUANTITY');
        const table_header = rowTemplate('INVENTORY', 'CODE', 'QUANTITY');

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.PRIMARY)
            .addTextDisplayComponents(this._text('# Item Inventory'))
            .addTextDisplayComponents(this._text('>>> `^use <code>` to activate an item.\n`^open <code` to open a crate.'))
            .addTextDisplayComponents(this._text(`\`\`\`ansi\n${active_header}\n${separator_line}\n${active_content}\`\`\``))
            .addTextDisplayComponents(this._text(`\`\`\`ansi\n${table_header}\n${separator_line}\n${table_content}\`\`\``));
        return this._finalize(container);
    }

    // ── Game Messages ────────────────────────────────────────────────

    static coinTossMessage(user, amount, frame)
    {
        const container = this._gameContainer(COLORS.GOLD, user)
            .addTextDisplayComponents(this._text(`# Coin Toss`))
            .addTextDisplayComponents(this._betText(user, amount))
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this._text(`# ═══════    ${frame ? frame : '🪙'}    ═══════`));
        return this._finalize(container);
    }

    static coinTossResultMessage(user, bet_amount, result)
    {
        const won = result === 'win';
        const container = this._gameContainer(won ? COLORS.SUCCESS : COLORS.ERROR, user)
            .addTextDisplayComponents(this._text(`# ${won ? 'You Win!' : 'You Lose!'}`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this._text(`#  ═══════    🪙    ═══════`));
        return this._finalize(container);
    }

    static numberGuessMessage(user, bet_amount, min_number, max_number, hinted_numbers, disabled)
    {
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
                    button.setStyle(1);
                else
                    button.setStyle(2);

                action_row.addComponents(button);
            }
            action_rows.push(action_row);
        }

        const container = this._gameContainer(COLORS.GOLD, user)
            .addTextDisplayComponents(this._text(`# Number Guess`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addSeparatorComponents(this._spacer())
            .addActionRowComponents(...action_rows);
        return this._finalize(container);
    }

    static numberGuessResultMessage(user, bet_amount, min_number, max_number, result)
    {
        const won = result.result === 'win';
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

        const container = this._gameContainer(won ? COLORS.SUCCESS : COLORS.ERROR, user)
            .addTextDisplayComponents(this._text(`# ${won ? 'You Win!' : 'You Lose!'}`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addSeparatorComponents(this._spacer())
            .addActionRowComponents(...action_rows);
        return this._finalize(container);
    }

    static blackjackMessage(user, player_hand, dealer_hand, bet_amount, cards, player_value, dealer_value, hide)
    {
        let dealer_cards_string = `### Dealer Hand (${hide ? "?" : dealer_value})\n# `;
        for(let i = 0; i < dealer_hand.length; i++)
        {
            if(hide && dealer_hand.length === 2 && i === 1)
                dealer_cards_string += `${cards['back'].code} `;
            else
                dealer_cards_string += `${dealer_hand[i].code} `;
        }

        let player_cards_string = `### Your Hand (${player_value})\n# `;
        for(const card of player_hand)
        {
            player_cards_string += `${card.code} `;
        }

        const hit_button = new ButtonBuilder()
            .setCustomId('blackjack_hit')
            .setLabel('Hit')
            .setStyle(1);

        const stand_button = new ButtonBuilder()
            .setCustomId('blackjack_stand')
            .setLabel('Stand')
            .setStyle(4);

        if(player_value >= 21)
        {
            hit_button.setDisabled(true);
            stand_button.setDisabled(true);
        }

        const container = this._gameContainer(COLORS.GOLD, user)
            .addTextDisplayComponents(this._text(`# Blackjack`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this._text(dealer_cards_string))
            .addTextDisplayComponents(this._text(player_cards_string))
            .addSeparatorComponents(this._spacer())
            .addSeparatorComponents(this._spacer())
            .addActionRowComponents(new ActionRowBuilder().addComponents(hit_button, stand_button));
        return this._finalize(container);
    }

    static blackjackResultMessage(user, player_hand, dealer_hand, bet_amount, player_value, dealer_value, result)
    {
        const res_text = result === 'win' ? 'You Win!' : result === 'loss' ? 'You Lose!' : 'Push!';
        const color = result === 'win' ? COLORS.SUCCESS : result === 'loss' ? COLORS.ERROR : COLORS.WARNING;

        let dealer_cards_string = `### Dealer Hand (${dealer_value})\n# `;
        for(const card of dealer_hand)
        {
            dealer_cards_string += `${card.code} `;
        }

        let player_cards_string = `### Your Hand (${player_value})\n# `;
        for(const card of player_hand)
        {
            player_cards_string += `${card.code} `;
        }

        const hit_button = new ButtonBuilder()
            .setCustomId('blackjack_hit')
            .setLabel('Hit')
            .setStyle(1)
            .setDisabled(true);

        const stand_button = new ButtonBuilder()
            .setCustomId('blackjack_stand')
            .setLabel('Stand')
            .setStyle(4)
            .setDisabled(true);

        const container = this._gameContainer(color, user)
            .addTextDisplayComponents(this._text(`# ${res_text}`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addSeparatorComponents(this._spacer())
            .addTextDisplayComponents(this._text(dealer_cards_string))
            .addTextDisplayComponents(this._text(player_cards_string))
            .addSeparatorComponents(this._spacer())
            .addSeparatorComponents(this._spacer())
            .addActionRowComponents(new ActionRowBuilder().addComponents(hit_button, stand_button));
        return this._finalize(container);
    }

    static selectMinesMessage(user, bet_amount)
    {
        const action_row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('mines_mine_select')
                .setPlaceholder('Select number of mines...')
                .addOptions(
                    {label: '1', value: '1'},
                    {label: '2', value: '2'},
                    {label: '3', value: '3'},
                    {label: '4', value: '4'},
                    {label: '5', value: '5'},
                    {label: '6', value: '6'},
                    {label: '7', value: '7'},
                    {label: '8', value: '8'},
                    {label: '9', value: '9'},
                    {label: '10', value: '10'}
                )
        );

        const container = this._gameContainer(COLORS.GOLD, user)
            .addTextDisplayComponents(this._text(`# Mines`))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addActionRowComponents(action_row);
        return this._finalize(container);
    }

    static minesGameMessage(user, bet_amount, cells, current_multiplier, cashed_out)
    {
        let head_text = `# Mines`;
        if(cashed_out)
            head_text = `# You Win!`;
        else if(current_multiplier < 1)
            head_text = `# You Lose!`;

        const color = cashed_out ? COLORS.SUCCESS : current_multiplier < 1 ? COLORS.ERROR : COLORS.GOLD;

        // cells: 0=safe, 1=mine, 2=revealed safe, 3=revealed mine
        let action_rows = [];
        for(let row = 0; row < 4; row++)
        {
            const action_row = new ActionRowBuilder();
            for(let col = 0; col < 5; col++)
            {
                const cell_index = row * 5 + col;
                const cell_value = cells[cell_index];

                const button = new ButtonBuilder()
                    .setCustomId(`mines_cell_${cell_index}`)
                    .setLabel('\u200B')
                    .setStyle(2)
                    .setDisabled(cashed_out || current_multiplier < 1);

                if(cell_value === 2) // revealed safe
                {
                    button.setStyle(1);
                    button.setDisabled(true);
                    button.setEmoji('💎');
                }
                else if(cell_value === 3) // revealed mine
                {
                    button.setStyle(4);
                    button.setDisabled(true);
                    button.setEmoji('💣');
                }

                action_row.addComponents(button);
            }
            action_rows.push(action_row);
        }

        const num_mines = cells.filter(c => c === 1 || c === 3).length;
        const cashout_button = new ButtonBuilder()
            .setCustomId('mines_cashout')
            .setLabel('Cash Out')
            .setStyle(3)
            .setDisabled(current_multiplier <= 1 || cashed_out);

        const section = new SectionBuilder()
            .addTextDisplayComponents(
                this._text(`**Mines: ${num_mines}**`),
                this._text(`\n**Current Multiplier: ${current_multiplier.toFixed(2)}x**`),
                this._text(`\n**Winnings: ${this.formatNumber(Math.floor(bet_amount * current_multiplier - bet_amount))}** 🥕`)
            )
            .setButtonAccessory(cashout_button);

        const container = this._gameContainer(color, user)
            .addTextDisplayComponents(this._text(head_text))
            .addTextDisplayComponents(this._betText(user, bet_amount))
            .addActionRowComponents(...action_rows)
            .addSeparatorComponents(this._spacer())
            .addSectionComponents(section);
        return this._finalize(container);
    }

    // ── Game Results ─────────────────────────────────────────────────

    static appendGameResult(message, game_name, bet_amount, result, base_payout, payout, result_array)
    {
        const container = message.components[0];
        // remove existing footer (last component of array)
        container.components.pop();

        let cont_obj = new ContainerBuilder(container.toJSON());

        const won = result === 'win';
        const left_pad = 18;
        const right_pad = 18;
        const rowTemplate = (name, value) => `${name.padEnd(left_pad)}${value.padStart(right_pad)}`;

        let result_calc = rowTemplate('Base Payout', `${won || result === 'push' ? `+ ${this.formatNumber(base_payout)}` : `- ${this.formatNumber(bet_amount)}`} 🥕`);
        for(const step of result_array)
        {
            result_calc += `\n${rowTemplate(step.label, step.calc + ' 🥕')}`;
        }
        result_calc += `\n${'-'.repeat(left_pad + right_pad)}\n`;
        result_calc += rowTemplate('Final Payout', `${won || result === 'push' ? '+ ' : '- '}${this.formatNumber(Math.abs(payout))} 🥕`);

        cont_obj
            .addTextDisplayComponents(this._text('## Result:'))
            .addTextDisplayComponents(this._text(`\`\`\`ansi\n${result_calc}\n\`\`\``));
        return this._finalize(cont_obj);
    }

    static levelUpMessage(user, username, rewards)
    {
        let rewards_string = "";
        for(const reward of rewards)
        {
            if(reward.key === 'carrots')
                rewards_string += `\n+ ${this.formatNumber(reward.amount)} 🥕`;
            else
                rewards_string += `\n+ ${this.colorLevelText(item_manager.getCrate(reward.key).name, parseInt(reward.key.split("c")[1]) * 20)} ${this.colorLevelText("x" + this.formatNumber(reward.amount), 1)}`;
        }

        const container = new ContainerBuilder()
            .setAccentColor(this.getLevelColor(user.progression.level))
            .addTextDisplayComponents(this._text(`## **Level ${user.progression.level - 1}**   →   **Level ${user.progression.level}**`))
            .addTextDisplayComponents(this._text(`> Congratulations <@${user.user_id}>!`))
            .addTextDisplayComponents(this._text(`### Rewards\n\`\`\`ansi${rewards_string}\`\`\``));
        return this._finalize(container);
    }

    // ── Stats Messages ───────────────────────────────────────────────

    static userStatsMessage(user, stats)
    {
        const xp_bar = this.userExperienceBar(user);

        const total = 52;
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

        const passive_mult = '+' + user.progression.passive_multiplier + '%';
        const user_field = `\`\`\`ansi\n${rowTemplate('\u001b[1mPassive Carrot Gain:\u001b[0m', passive_mult)}\`\`\``;

        const stats_field = `\`\`\`ansi\n${[
            rowTemplate('\u001b[1mHighest Balance:\u001b[0m', this.formatNumber(stats.highest_balance) + ' 🥕'),
            rowTemplate('\u001b[1mTotal Carrots Won:\u001b[0m', this.formatNumber(stats.total_money_won) + ' 🥕'),
            rowTemplate('\u001b[1mTotal Carrots Lost:\u001b[0m', this.formatNumber(stats.total_money_lost) + ' 🥕'),
            rowTemplate('\u001b[1mBiggest Win:\u001b[0m', this.formatNumber(stats.highest_single_win) + ' 🥕'),
            rowTemplate('\u001b[1mBiggest Loss:\u001b[0m', this.formatNumber(stats.highest_single_loss) + ' 🥕')
        ].join('\n')}\`\`\``;

        const games_field = `\`\`\`ansi\n${[
            rowTemplate('\u001b[1mTotal Games Played:\u001b[0m', this.formatNumber(stats.total_games_played)),
            rowTemplate('\u001b[1mTotal Wins:\u001b[0m', this.formatNumber(stats.total_games_won)),
            rowTemplate('\u001b[1mTotal Losses:\u001b[0m', this.formatNumber(stats.total_games_lost)),
            rowTemplate('\u001b[1mWin Rate:\u001b[0m', ((stats.total_games_won / Math.max(stats.total_games_played, 1)) * 100).toFixed(2) + '%')
        ].join('\n')}\`\`\``;

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.INFO)
            .addTextDisplayComponents(this._text(`# Gamba Statistics\n>>> Statistics for <@${user.user_id}>`))
            .addTextDisplayComponents(
                xp_bar,
                this._text(user_field),
                this._text(stats_field),
                this._text(games_field)
            );
        return this._finalize(container);
    }

    static userGameStatsMessage(user, game_name, user_stats, global_stats)
    {
        const v_game_name = game_name.charAt(0).toUpperCase() + game_name.slice(1);

        const total = 52;
        const stat_value_width = Math.max(
            this.formatNumber(user_stats.total_games_played).length + 3,
            this.formatNumber(user_stats.total_games_won).length + 3,
            this.formatNumber(user_stats.total_games_lost).length + 3,
            this.formatNumber(user_stats.total_money_wagered).length + 3,
            this.formatNumber(user_stats.total_money_won).length + 3,
            this.formatNumber(user_stats.total_money_lost).length + 3,
            this.formatNumber(global_stats.total_games_played).length + 3,
            this.formatNumber(global_stats.total_games_won).length + 3,
            this.formatNumber(global_stats.total_games_lost).length + 3,
            this.formatNumber(global_stats.total_money_wagered).length + 3,
            this.formatNumber(global_stats.total_money_won).length + 3,
            this.formatNumber(global_stats.total_money_lost).length + 3
        );
        const stat_name_width = total - stat_value_width;
        const rowTemplate = (name, value) => `${name.padEnd(stat_name_width)}${value.padStart(stat_value_width)}`;

        const buildStatsBlock = (stats) => [
            rowTemplate('\u001b[1mGames Played:\u001b[0m', this.formatNumber(stats.total_games_played)),
            rowTemplate('\u001b[1mWins:\u001b[0m', this.formatNumber(stats.total_games_won)),
            rowTemplate('\u001b[1mLosses:\u001b[0m', this.formatNumber(stats.total_games_lost)),
            rowTemplate('\u001b[1mCarrots Wagered:\u001b[0m', this.formatNumber(stats.total_money_wagered) + ' 🥕'),
            rowTemplate('\u001b[1mCarrots Won:\u001b[0m', this.formatNumber(stats.total_money_won) + ' 🥕'),
            rowTemplate('\u001b[1mCarrots Lost:\u001b[0m', this.formatNumber(stats.total_money_lost) + ' 🥕')
        ].join('\n');

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.INFO)
            .addTextDisplayComponents(this._text(`# ${v_game_name} Statistics\n>>> Statistics for <@${user.user_id}>`))
            .addTextDisplayComponents(this._text(`## Your Stats\n\`\`\`ansi\n${buildStatsBlock(user_stats)}\n\`\`\``))
            .addTextDisplayComponents(this._text(`## Global Stats\n\`\`\`ansi\n${buildStatsBlock(global_stats)}\n\`\`\``));
        return this._finalize(container);
    }

    // ── Utility Messages ─────────────────────────────────────────────

    static helpMessage(selection, info)
    {
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

        let command_list = '## Commands\n';
        const commands = command_manager.getCommandsByCategory(selection);
        for(const command in commands)
        {
            const command_name = command.charAt(0).toUpperCase() + command.slice(1);
            command_list += `\n**${command_name}**\n> *${commands[command].description}*\n> Usage: \`${commands[command].usage}\`\n`;
        }

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.PRIMARY)
            .addTextDisplayComponents(this._text('# Carrot Gamba Help'))
            .addTextDisplayComponents(this._text('>>> List of available commands:\n`<>` = required argument, `[]` = optional argument'))
            .addActionRowComponents(new ActionRowBuilder().addComponents(string_select));

        if(info[selection])
        {
            container.addTextDisplayComponents(this._text(`## Info\n>>> ${info[selection].how_it_works}\n\n${info[selection].example}`));
        }

        container.addTextDisplayComponents(this._text(command_list));
        return this._finalize(container);
    }

    static leaderboardMessage(boards, selection)
    {
        const board = boards[selection];

        const string_select = new StringSelectMenuBuilder()
            .setCustomId('leaderboard_select')
            .setPlaceholder('Choose a leaderboard...')
            .addOptions(
                {label: 'Current Standings', value: 'balance', default: selection === 'balance'},
                {label: 'All-Time', value: 'highest_balance', default: selection === 'highest_balance'}
            );

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
            const rank_str = rank == 1 ? '🥇' : rank == 2 ? '🥈' : rank == 3 ? '🥉' : " "+ rank.toString();
            const display_name = entry.username.length > 14 ? entry.username.substring(0, 14) + '...' : entry.username;
            const level = this.colorLevelText(`Lv.${entry.progression.level}`, entry.progression.level);
            const combined_name = `${display_name} ${level}`;
            const balance = this.formatNumber(entry[selection]) + ' 🥕';

            table_content += rowTemplate(rank_str, combined_name, balance) + '\n';
            rank++;
        }

        const container = new ContainerBuilder()
            .setAccentColor(COLORS.GOLD)
            .addTextDisplayComponents(this._text(`# Leaderboard`))
            .addActionRowComponents(new ActionRowBuilder().addComponents(string_select))
            .addTextDisplayComponents(this._text(`\`\`\`ansi\n${table_header}\n${separator_line}\n${table_content}\`\`\``));
        return this._finalize(container);
    }
}
