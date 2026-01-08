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
        const winning_number = Math.floor(Math.random() * this.max_number) + 1;

        const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);
        // if number oracle item used, choose 4 random numbers
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
        const prompt_message = await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.numberGuessMessage(username, bet_amount, this.min_number, this.max_number, hinted_numbers)]
        });
    }
}