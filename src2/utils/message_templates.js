import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize } from 'discord.js';

// colors for different types of messages
const COLORS = {
    PRIMARY: 0x90D5FF,
    SUCCESS: 0x57F287,
    ERROR: 0xF04747,
    INFO: '#4F545C',
    WARNING: 0xFAA61A,
    GOLD: 0xFFB636
};

const RARITY_COLORS = {
    COMMON: 0xAAAAAA,
    UNCOMMON: 0x87CEEB,
    RARE: 0x6495ED,
    EPIC: 0xDA70D6,
    LEGENDARY: 0xFFD700,
    MYTHIC: 0xFF6B6B
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
            RARITY_COLORS.COMMON,
            RARITY_COLORS.UNCOMMON,
            RARITY_COLORS.RARE,
            RARITY_COLORS.EPIC,
            RARITY_COLORS.LEGENDARY,
            RARITY_COLORS.MYTHIC
        ];
        
        const color_index = Math.min(
        Math.floor((level - 1) / (100 / colors.length)), colors.length - 1);
        return colors[color_index];
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
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** tossed a coin with a bet of **${this.formatNumber(amount)}** 🥕`);
        const coin = new TextDisplayBuilder().setContent(`# ═══════    ${frame ? frame : '🪙'}    ═══════`);
        const result_placeholder = new TextDisplayBuilder().setContent(`### Result:  ...`);

        const container = new ContainerBuilder()
        .setAccentColor(COLORS.GOLD)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(coin)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(result_placeholder)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }

    static coinTossResultMessage(username, bet_amount, result)
    {
        const won = result === 'win';
        const spacer = new SeparatorBuilder().setDivider(false);
        const header = new TextDisplayBuilder().setContent(`# ${won ? 'You Win!' : 'You Lose!'}`);
        const p = new TextDisplayBuilder().setContent(`>>> **${username}** tossed a coin with a bet of **${this.formatNumber(bet_amount)}** 🥕`);
        const coin = new TextDisplayBuilder().setContent(`#  ═══════    🪙    ═══════`);
        const r = new TextDisplayBuilder().setContent(`### Result: ${won ? ' + '+this.formatNumber(bet_amount) : ' - '+this.formatNumber(bet_amount)} 🥕`);

        const container = new ContainerBuilder()
        .setAccentColor(won ? COLORS.SUCCESS : COLORS.ERROR)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(coin)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(r)
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
            rewards_string += `\n+ ${reward.amount} ${reward.type === 'carrots' ? '🥕' : reward.type}`;
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

    static userExperienceBar(user, bet_amount, result)
    {

    }
}