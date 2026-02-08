import { Game } from './Game.js';
import { item_manager } from "../items/item_manager.js";
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class Mines extends Game
{
    constructor()
    {
        super('mines');
        this.num_cells = 20;
        this.total_safe = 20;
        this.safe_revealed = 0;
    }

    async play(user, message, bet_amount)
    {
        // create array of 16 cells with 0
        const cells = new Array(this.num_cells).fill(0);

        // send message for user to select number of mines 2-5
        const game_message = await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.selectMinesMessage(user, bet_amount)]
        });

        const select_collector = game_message.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id && i.customId === 'mines_mine_select',
            time: 30000
        });

        const result = await new Promise((resolve) =>
        {
            select_collector.on('collect', async (interaction) =>
            {
                // confirm interaction
                await interaction.deferUpdate();

                const selected_mines = parseInt(interaction.values[0]);
                this.total_safe = this.num_cells - selected_mines;

                // generate random mine positions 0-15 and set cells to 1 for mines
                const mine_positions = new Set();
                while(mine_positions.size < selected_mines)
                {
                    mine_positions.add(Math.floor(Math.random() * this.num_cells));
                }
                for(const pos of mine_positions)
                {
                    cells[pos] = 1;
                }

                const res = await this.startGame(user, interaction, bet_amount, cells);
                resolve(res);
            });
        });

        return result;
    }

    async startGame(user, interaction, bet_amount, cells)
    {
        await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.minesGameMessage(user, bet_amount, cells, 1)]
        });

        const game_collector  = interaction.message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id && (i.customId.startsWith('mines_cell_') || i.customId === 'mines_cashout'),
            time: 60000
        });
        
        return await new Promise((resolve) =>
        {
            game_collector.on('collect', async (cell_interaction) =>
            {
                // confirm interaction
                await cell_interaction.deferUpdate();

                if(cell_interaction.customId === 'mines_cashout')
                {
                    // calculate mult
                    const safe_remaining = this.total_safe - this.safe_revealed;
                    const current_multiplier = this.total_safe / safe_remaining;

                    await cell_interaction.editReply({
                        flags: MessageFlags.IsComponentsV2,
                        components: [MessageTemplates.minesGameMessage(user, bet_amount, cells, current_multiplier, true)]
                    });

                    resolve({result: 'win', payout: Math.floor(bet_amount * current_multiplier), message: cell_interaction.message, base_payout: Math.floor(bet_amount * current_multiplier)});
                }
                else
                {
                    // see which cell was selected
                    const cell_index = parseInt(cell_interaction.customId.split('_')[2]);

                    if(cells[cell_index] === 1)
                    {
                        cells[cell_index] = 3;

                        await cell_interaction.editReply({
                            flags: MessageFlags.IsComponentsV2,
                            components: [MessageTemplates.minesGameMessage(user, bet_amount, cells, 0, false)]
                        });

                        resolve({result: 'loss', payout: -bet_amount, message: cell_interaction.message, base_payout: bet_amount});
                    }
                    else
                    {
                        this.safe_revealed++;
                        cells[cell_index] = 2;

                        // calculate mult
                        const safe_remaining = this.total_safe - this.safe_revealed;
                        const current_multiplier = this.total_safe / safe_remaining;

                        cell_interaction.editReply({
                            flags: MessageFlags.IsComponentsV2,
                            components: [MessageTemplates.minesGameMessage(user, bet_amount, cells, current_multiplier, false)]
                        });
                    }
                }
            });
        });
    }
}