import { ContainerBuilder, ButtonBuilder, ActionRowBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, SeparatorBuilder } from 'discord.js';
import { command_manager } from '../commands/command_manager.js';

// colors for different types of messages
const COLORS = {
    PRIMARY: 0x57F287,
    SUCCESS: '#43B581',
    ERROR: '#F04747',
    INFO: '#4F545C',
    WARNING: '#FAA61A',
    GOLD: '#FFB636'
};

export class MessageTemplates
{
    static getStandardFooter()
    {
        return { 
            content: '-# Use ^help for commands \t\t\t\t\t [Carrot Gamba](https://github.com/glwhitaker/Carrot_Gamba)',
        };
    }

    static formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // regular error
    static errorMessage(message)
    {
        return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('Error')
        .setDescription(message)
        .setFooter(this.getStandardFooter('error'))
        .setTimestamp();
    }

    static successMessage(title, message)
    {
        return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(title)
        .setDescription(message)
        .setFooter(this.getStandardFooter('success'))
        .setTimestamp();
    }

    static balanceMessage(username, balance)
    {
        const formattedBalance = this.formatNumber(balance) + ' 🥕';

        const separator = new SeparatorBuilder();

        const header = new TextDisplayBuilder().setContent('# Carrot Bank');
        const account_field = new TextDisplayBuilder().setContent(`**Account Holder**\n\`${username}\``);
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
        .setAccentColor(COLORS.PRIMARY)
        .addSectionComponents(section_1)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(balance_field)
        .addTextDisplayComponents(this.getStandardFooter());

        return container;
    }
}