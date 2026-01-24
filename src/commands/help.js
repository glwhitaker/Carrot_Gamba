import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleHelp(args, message, usage)
{
    const info = {
        items: {
            how_it_works: 'Items can be used to gain temporary advantages in games, enhance your earnings, ' +
            'or protect yourself from losses. Activating an item will consume it from your inventory ' +
            'and will be added to your active items list. Active items provide their benefits automatically when applicable.',
            example: 'For example, say you activate a **Second Chance Token**. Upon your next loss, the ' +
            'token will be used automatically, providing you with a second chance to win without losing your bet.'
        }
    }
    
    const reply = await message.reply({
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

        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.helpMessage(selected_category, info)]
        });
    });
}