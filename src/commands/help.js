import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export async function handleHelp(args, message, usage)
{
    const info = {
        items: {
            how_it_works: 'Use `^use <code>` to activate an item. Active items trigger automatically when applicable.',
            example: 'For example, activating a **Second Chance Token** gives you a retry if you lose your next game.'
        }
    }

    const reply = await message_dispatcher.reply(message, {
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.helpMessage('economy', info)]
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

        await message_dispatcher.editReply(interaction, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.helpMessage(selected_category, info)]
        });
    });
}