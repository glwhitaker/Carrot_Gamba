import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize } from 'discord.js';

// colors for different types of messages
const COLORS = {
    PRIMARY: 0x606060,
    SUCCESS: 0x57F287,
    ERROR: 0xF04747,
    INFO: '#4F545C',
    WARNING: '#FAA61A',
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
        const formattedBalance = this.formatNumber(balance) + ' 🥕';

        const separator = new SeparatorBuilder();
        const spacer = new SeparatorBuilder().setDivider(false);

        const header = new TextDisplayBuilder().setContent('# Carrot Bank');
        const account_field = new TextDisplayBuilder().setContent(`>>> **Account Holder**\n\`${username}\``);
        const balance_field = new TextDisplayBuilder().setContent(`### Carrots \`\`\`${formattedBalance}\`\`\``);

        const thumbnail = new ThumbnailBuilder({
            media: {
                url: "attachment://image.png"
            }
        });

        const section_1 = new SectionBuilder()
        .addTextDisplayComponents(
            header,
            account_field
        )
        .setThumbnailAccessory(thumbnail);

        const container = new ContainerBuilder()
        .addSectionComponents(section_1)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(balance_field)
        .addSeparatorComponents(spacer)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }
}