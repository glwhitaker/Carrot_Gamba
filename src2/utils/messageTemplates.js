import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize } from 'discord.js';

// colors for different types of messages
const COLORS = {
    PRIMARY: 0x90D5FF,
    SUCCESS: 0x57F287,
    ERROR: 0xF04747,
    INFO: '#4F545C',
    WARNING: 0xFAA61A,
    GOLD: '#FFB636'
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

    // regular error
    static errorMessage(message)
    {
        const header = new TextDisplayBuilder().setContent(`## Error`);
        const p = new TextDisplayBuilder().setContent(`> ${message}`);

        return new ContainerBuilder()
        .setAccentColor(COLORS.ERROR)
        .addTextDisplayComponents(header)
        .addTextDisplayComponents(p)
        .addTextDisplayComponents(this.getStandardFooter());
    }

    static successMessage(title, message)
    {
        const header = new TextDisplayBuilder().setContent(`## ${title}`);
        const p = new TextDisplayBuilder().setContent(`> ${message}`);

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
        const p = new TextDisplayBuilder().setContent(`### Carrots Earned:\n> +**${amount}** 🥕`);

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
        const p = new TextDisplayBuilder().setContent(`### Carrots Earned:\n> +**${amount}** 🥕`);

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
}