import { Game } from './Game.js';
import { Deck } from './Deck.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export class RideTheBus extends Game
{
    constructor()
    {
        super('ridethebus');
        this.min_bet = 10;
    }

    cardRank(card)
    {
        if(card.value === 'A') return 1;
        if(card.value === 'J') return 11;
        if(card.value === 'Q') return 12;
        if(card.value === 'K') return 13;
        return parseInt(card.value);
    }

    cardColor(card)
    {
        return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'red' : 'black';
    }

    _lossResult(game_message, bet_amount)
    {
        return { result: 'loss', payout: -bet_amount, message: game_message, base_payout: bet_amount };
    }

    _winResult(game_message, bet_amount, multiplier)
    {
        const net = Math.floor(bet_amount * (multiplier - 1));
        return { result: 'win', payout: net, message: game_message, base_payout: net };
    }

    async _editMessage(game_message, user, bet_amount, drawn, round, cashout_multiplier, cashout_profit, result)
    {
        await message_dispatcher.edit(game_message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.rideBusMessage(
                user, bet_amount, drawn, round, cashout_multiplier, cashout_profit, result
            )]
        });
    }

    // Round 1: Red or Black?
    async playRound1(deck, game_message, message, user, bet_amount)
    {
        return new Promise((resolve) =>
        {
            const collector = game_message.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id &&
                    (i.customId === 'rtb_red' || i.customId === 'rtb_black'),
                time: 30000
            });

            collector.on('collect', async (interaction) =>
            {
                if(!await this.safeDeferUpdate(interaction))
                {
                    collector.stop();
                    resolve({ done: true, result: await this.handleInteractionError(game_message) });
                    return;
                }

                const guess = interaction.customId === 'rtb_red' ? 'red' : 'black';
                const card = deck.draw();

                collector.stop();

                if(this.cardColor(card) !== guess)
                {
                    await this._editMessage(game_message, user, bet_amount, [card], 1, 1, 0, 'loss');
                    resolve({ done: true, result: this._lossResult(game_message, bet_amount) });
                }
                else
                {
                    await this._editMessage(game_message, user, bet_amount, [card], 2, 2, Math.floor(bet_amount * 1), 'playing');
                    resolve({ done: false, card });
                }
            });

            collector.on('end', async (collected, reason) =>
            {
                if(reason === 'time' && collected.size === 0)
                    resolve({ done: true, result: await this.handleTimeout(user, game_message) });
            });
        });
    }

    // Round 2: Higher or Lower? (relative to card 1). Tie = loss.
    async playRound2(deck, game_message, message, user, bet_amount, drawn)
    {
        return new Promise((resolve) =>
        {
            const collector = game_message.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id &&
                    ['rtb_higher', 'rtb_lower', 'rtb_cashout'].includes(i.customId),
                time: 30000
            });

            collector.on('collect', async (interaction) =>
            {
                if(!await this.safeDeferUpdate(interaction))
                {
                    collector.stop();
                    resolve({ done: true, result: await this.handleInteractionError(game_message) });
                    return;
                }

                collector.stop();

                if(interaction.customId === 'rtb_cashout')
                {
                    await this._editMessage(game_message, user, bet_amount, drawn, 2, 2, Math.floor(bet_amount * 1), 'win');
                    resolve({ done: true, result: this._winResult(game_message, bet_amount, 2) });
                    return;
                }

                const guess = interaction.customId === 'rtb_higher' ? 'higher' : 'lower';
                const card = deck.draw();
                const new_drawn = [...drawn, card];
                const r1 = this.cardRank(drawn[0]);
                const r2 = this.cardRank(card);
                const win = (guess === 'higher' && r2 > r1) || (guess === 'lower' && r2 < r1);

                if(!win)
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 2, 2, Math.floor(bet_amount * 1), 'loss');
                    resolve({ done: true, result: this._lossResult(game_message, bet_amount) });
                }
                else
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 3, 3, Math.floor(bet_amount * 2), 'playing');
                    resolve({ done: false, card });
                }
            });

            collector.on('end', async (collected, reason) =>
            {
                if(reason === 'time' && collected.size === 0)
                    resolve({ done: true, result: await this.handleTimeout(user, game_message) });
            });
        });
    }

    // Round 3: Inside or Outside? Boundaries are exclusive — matching a boundary rank is a loss.
    async playRound3(deck, game_message, message, user, bet_amount, drawn)
    {
        return new Promise((resolve) =>
        {
            const collector = game_message.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id &&
                    ['rtb_inside', 'rtb_outside', 'rtb_cashout'].includes(i.customId),
                time: 30000
            });

            collector.on('collect', async (interaction) =>
            {
                if(!await this.safeDeferUpdate(interaction))
                {
                    collector.stop();
                    resolve({ done: true, result: await this.handleInteractionError(game_message) });
                    return;
                }

                collector.stop();

                if(interaction.customId === 'rtb_cashout')
                {
                    await this._editMessage(game_message, user, bet_amount, drawn, 3, 3, Math.floor(bet_amount * 2), 'win');
                    resolve({ done: true, result: this._winResult(game_message, bet_amount, 3) });
                    return;
                }

                const guess = interaction.customId === 'rtb_inside' ? 'inside' : 'outside';
                const card = deck.draw();
                const new_drawn = [...drawn, card];
                const r1 = this.cardRank(drawn[0]);
                const r2 = this.cardRank(drawn[1]);
                const r3 = this.cardRank(card);
                const lo = Math.min(r1, r2);
                const hi = Math.max(r1, r2);
                const win = (guess === 'inside'  && r3 > lo && r3 < hi) ||
                            (guess === 'outside' && (r3 < lo || r3 > hi));

                if(!win)
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 3, 3, Math.floor(bet_amount * 2), 'loss');
                    resolve({ done: true, result: this._lossResult(game_message, bet_amount) });
                }
                else
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 4, 4, Math.floor(bet_amount * 3), 'playing');
                    resolve({ done: false, card });
                }
            });

            collector.on('end', async (collected, reason) =>
            {
                if(reason === 'time' && collected.size === 0)
                    resolve({ done: true, result: await this.handleTimeout(user, game_message) });
            });
        });
    }

    // Round 4: Guess the suit! Win = 20x. Game always ends here.
    async playRound4(deck, game_message, message, user, bet_amount, drawn)
    {
        const suit_ids = ['rtb_suit_clubs', 'rtb_suit_diamonds', 'rtb_suit_hearts', 'rtb_suit_spades'];

        return new Promise((resolve) =>
        {
            const collector = game_message.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id &&
                    (suit_ids.includes(i.customId) || i.customId === 'rtb_cashout'),
                time: 30000
            });

            collector.on('collect', async (interaction) =>
            {
                if(!await this.safeDeferUpdate(interaction))
                {
                    collector.stop();
                    resolve({ result: await this.handleInteractionError(game_message) });
                    return;
                }

                collector.stop();

                if(interaction.customId === 'rtb_cashout')
                {
                    await this._editMessage(game_message, user, bet_amount, drawn, 4, 4, Math.floor(bet_amount * 3), 'win');
                    resolve({ result: this._winResult(game_message, bet_amount, 4) });
                    return;
                }

                const guess_suit = interaction.customId.replace('rtb_suit_', '');
                const card = deck.draw();
                const new_drawn = [...drawn, card];

                if(card.suit === guess_suit)
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 4, 20, Math.floor(bet_amount * 19), 'win');
                    resolve({ result: this._winResult(game_message, bet_amount, 20) });
                }
                else
                {
                    await this._editMessage(game_message, user, bet_amount, new_drawn, 4, 4, Math.floor(bet_amount * 3), 'loss');
                    resolve({ result: this._lossResult(game_message, bet_amount) });
                }
            });

            collector.on('end', async (collected, reason) =>
            {
                if(reason === 'time' && collected.size === 0)
                    resolve({ result: await this.handleTimeout(user, game_message) });
            });
        });
    }

    async play(user, message, bet_amount)
    {
        const deck = new Deck();
        deck.shuffle();

        const game_message = await message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [MessageTemplates.rideBusMessage(
                user, bet_amount, [], 1, 1, 0, 'playing'
            )]
        });

        const r1 = await this.playRound1(deck, game_message, message, user, bet_amount);
        if(r1.done) return r1.result;

        const r2 = await this.playRound2(deck, game_message, message, user, bet_amount, [r1.card]);
        if(r2.done) return r2.result;

        const r3 = await this.playRound3(deck, game_message, message, user, bet_amount, [r1.card, r2.card]);
        if(r3.done) return r3.result;

        const r4 = await this.playRound4(deck, game_message, message, user, bet_amount, [r1.card, r2.card, r3.card]);
        return r4.result;
    }
}
