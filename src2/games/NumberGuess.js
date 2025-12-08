import { Game } from './Game.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export class CoinToss extends Game
{
    constructor()
    {
        super('cointoss');
        this.multiplier = 10;
        this.max_number = 10;
        this.min_number = 1;
    }

    async play(user, message, bet_amount)
    {
        const user_id = message.author.id;
        const guild_id = message.guild.id;
        const username = message.author.username;

        // generate a number 1 to 10
        const winning_number = Math.floor(Math.random() * this.max_number) + 1;
    }
}