import { db_manager } from '../db/db_manager.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleLeaderboard(args, message)
{
    const guild_id = message.guild.id;
    const leaderboards = {};
    leaderboards.balance = await db_manager.getLeaderboard(guild_id);
    leaderboards.highest_balance = await db_manager.getAllTimeLeaderboard(guild_id);

    const reply = await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.leaderboardMessage(leaderboards, 'balance')]
    });

    const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id && i.customId === 'leaderboard_select',
        time: 30000
    });

    collector.on('collect', async (interaction) =>
    {
        // confirm interaction
        await interaction.deferUpdate();

        const selected_category = interaction.values[0];

        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.leaderboardMessage(leaderboards, selected_category)]
        });
    });
}