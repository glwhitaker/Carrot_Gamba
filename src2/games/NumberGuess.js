import { Game } from './Game.js';
import { item_manager } from "../items/item_manager.js";
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class NumberGuess extends Game
{
    constructor()
    {
        super('numberguess');
        this.multiplier = 10;
        this.max_number = 10;
        this.min_number = 1;
    }

    async play(user, message, bet_amount)
    {
        const username = message.author.username;

        // generate a number 1 to 10
        // const winning_number = Math.floor(Math.random() * this.max_number) + 1;
        const winning_number = 1;
        
        // if number oracle item used, choose 4 random numbers
        const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);
        const hinted_numbers = [];
        if(active_items['number_oracle'])
        {
            while(hinted_numbers.length < 4)
            {
                const rand_num = Math.floor(Math.random() * this.max_number) + 1;
                if(rand_num !== winning_number && !hinted_numbers.includes(rand_num))
                    hinted_numbers.push(rand_num);
            }
            // add winning number to hinted numbers
            hinted_numbers.push(winning_number);

            // consume item
            await item_manager.consumeItemForUser(user.user_id, user.guild_id, 'number_oracle', 1);
        }

        // show initial message prompting user to choose a number
        const game_message = await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.numberGuessMessage(username, bet_amount, this.min_number, this.max_number, hinted_numbers, false)]
        });

        // create collector for button interaction
        const collector = game_message.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 30000
        });

        const result = await new Promise((resolve) =>
        {
            collector.on('collect', async (interaction) =>
            {
                // confirm interaction
                await interaction.deferUpdate();
                const guessed_number = parseInt(interaction.customId.split('_')[1]);
                const win = (guessed_number === winning_number);
                const base_payout = bet_amount * this.multiplier;
                const payout = win ? bet_amount * this.multiplier : -bet_amount;
                const result_str = win ? 'win' : 'loss';

                const temp_res = {result: result_str, payout: payout, message: game_message, guessed_number: guessed_number, winning_number: winning_number, base_payout: base_payout};

                game_message.edit({
                    flags: MessageFlags.IsComponentsV2,
                    components: [
                        MessageTemplates.numberGuessResultMessage(username, bet_amount, this.min_number, this.max_number, temp_res)
                    ]
                });

                collector.stop();
                resolve(temp_res);
            });
        });

        return result;
    }
}