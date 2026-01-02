import { Game } from './Game.js';
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

    async play(user, message, bet_amount, item_used)
    {
        const user_id = message.author.id;
        const guild_id = message.guild.id;
        const username = message.author.username;

        // generate a number 1 to 10
        const winning_number = Math.floor(Math.random() * this.max_number) + 1;
    }
}