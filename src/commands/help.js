import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleHelp(args, message, usage)
{
    const reply = await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.helpMessage('economy')]
    });

    const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id && i.customId === 'help_category_select',
        time: 30000
    });

    collector.on('collect', async (interaction) =>
    {
        // confirm interaction
        await interaction.deferUpdate();

        const selected_category = interaction.values[0];

        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.helpMessage(selected_category)]
        });
    });
}