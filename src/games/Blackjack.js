import { Game } from './Game.js';
import { CARDS, Deck } from './Deck.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { item_manager } from '../items/item_manager.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export class Blackjack extends Game
{
    constructor()
    {
        super('blackjack');
        this.deck = [];
        this.dealer_hand = [];
        this.player_hand = [];
    }

    createDeck()
    {
        this.player_hand = [];
        this.dealer_hand = [];
        const d = new Deck();
        d.shuffle();
        this.deck = d.cards;
    }

    dealCard(hand, ace_override)
    {
        if(ace_override)
        {
            // find ace
            const ace = this.deck.find(card => card.value == 'A' && card.suit == 'spades');
            hand.push(ace);
            this.deck.splice(this.deck.indexOf(ace), 1);
        }
        else
            hand.push(this.deck.pop());
    }

    calculateHandValue(hand)
    {
        let value  = 0;
        let ace_count = 0;

        for(const card of hand)
        {
            if(['J', 'Q', 'K'].includes(card.value))
                value += 10;
            else if(card.value === 'A')
            {
                value += 11
                ace_count += 1;
            }
            else
                value += parseInt(card.value);

            // adjust for aces
            while(value > 21 && ace_count > 0)
            {
                value -= 10;
                ace_count -= 1;
            }
        }

        return value;
    }

    async update_game_message(game_message, user, bet_amount, player_value, dealer_value, hide_dealer)
    {
        await message_dispatcher.edit(game_message, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackMessage(
                    user,
                    this.player_hand,
                    this.dealer_hand,
                    bet_amount,
                    CARDS,
                    player_value,
                    dealer_value,
                    hide_dealer
                )
            ]
        });
    }

    async update_result_message(game_message, user, bet_amount, player_value, dealer_value, result)
    {
        await message_dispatcher.edit(game_message, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackResultMessage(
                    user,
                    this.player_hand,
                    this.dealer_hand,
                    bet_amount,
                    player_value,
                    dealer_value,
                    result
                )
            ]
        });
    }

    async sleep(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async stand(game_message, user, bet_amount)
    {
        let res = {};

        const player_value = this.calculateHandValue(this.player_hand);
        let dealer_value = this.calculateHandValue(this.dealer_hand);

        await this.update_game_message(
            game_message,
            user,
            bet_amount,
            player_value,
            dealer_value,
            false
        );

        while(dealer_value < 17)
        {
            this.dealCard(this.dealer_hand);
            dealer_value = this.calculateHandValue(this.dealer_hand);

            await this.sleep(1000);

            await this.update_game_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                false
            );
        }

        if(dealer_value > 21 || player_value > dealer_value)
        {
            await this.update_result_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                'win'
            );

            res = {
                result: 'win',
                payout: bet_amount,
                message: game_message,
                player_value: player_value,
                dealer_value: dealer_value,
                base_payout: bet_amount
            };
        }
        else if(player_value < dealer_value)
        {
            await this.update_result_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                'loss'
            );

            res = {
                result: 'loss',
                payout: -bet_amount,
                message: game_message,
                player_value: player_value,
                dealer_value: dealer_value,
                base_payout: bet_amount
            };
        }
        else
        {
            await this.update_result_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                'push'
            );

            res = {
                result: 'push',
                payout: 0,
                message: game_message,
                player_value: player_value,
                dealer_value: dealer_value,
                base_payout: 0
            };
        }

        return res;
    }

    async play(user, message, bet_amount)
    {
        const username = message.author.username;
        const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);

        this.createDeck();

        if(active_items['ace'])
        {
            this.dealCard(this.player_hand, true);
            await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'xrv', 1);
        }
        else
            this.dealCard(this.player_hand, false);

        this.dealCard(this.dealer_hand);
        this.dealCard(this.player_hand);
        this.dealCard(this.dealer_hand);

        const player_value = this.calculateHandValue(this.player_hand);
        const dealer_value = this.calculateHandValue(this.dealer_hand);

        // if x-ray vision item used, reveal dealer's hidden card
        let hide_dealer = true;
        if(active_items['xrv'])
        {
            hide_dealer = false;
        }

        const game_message = await message_dispatcher.reply(message, {
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackMessage(
                    user,
                    this.player_hand,
                    this.dealer_hand,
                    bet_amount,
                    CARDS,
                    player_value,
                    dealer_value,
                    hide_dealer
                )
            ]
        });

        if(player_value === 21)
        {
            await this.update_game_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                false
            );

            if(dealer_value === 21)
            {
                await this.update_result_message(
                    game_message,
                    user,
                    bet_amount,
                    player_value,
                    dealer_value,
                    'push'
                );

                if(active_items['xrv'])
                    await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'xrv', 1);

                return {
                    result: 'push',
                    payout: 0,
                    message: game_message,
                    player_value: player_value,
                    dealer_value: dealer_value,
                    base_payout: 0
                };
            }

            const blackjack_payout = Math.floor(bet_amount * 1.5);

            await this.update_result_message(
                game_message,
                user,
                bet_amount,
                player_value,
                dealer_value,
                'win'
            );

            if(active_items['xrv'])
                    await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'xrv', 1);

            return {
                result: 'win',
                payout: blackjack_payout,
                message: game_message,
                player_value: player_value,
                dealer_value: dealer_value,
                base_payout: blackjack_payout
            };
        }

        const collector = game_message.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 30000
        });

        const result = await new Promise((resolve) =>
        {
            collector.on('collect', async (interaction) =>
            {
                if(!await this.safeDeferUpdate(interaction))
                {
                    collector.stop();
                    resolve(await this.handleInteractionError(game_message));
                    return;
                }

                const hit_or_stand = interaction.customId.split('_')[1];

                if(hit_or_stand === 'hit')
                {
                    this.dealCard(this.player_hand);
                    const player_value = this.calculateHandValue(this.player_hand);

                    if(player_value > 21)
                    {
                        await this.update_result_message(
                            game_message,
                            user,
                            bet_amount,
                            player_value,
                            dealer_value,
                            'loss'
                        );

                        collector.stop();
                        resolve({
                            result: 'loss',
                            payout: -bet_amount,
                            message: game_message,
                            player_value: player_value,
                            dealer_value: dealer_value,
                            base_payout: bet_amount
                        });
                    }
                    else if(player_value === 21)
                    {
                        const result = await this.stand(game_message, user, bet_amount);
                        collector.stop();
                        resolve(result);
                    }
                    else
                    {
                        await this.update_game_message(
                            game_message,
                            user,
                            bet_amount,
                            player_value,
                            dealer_value,
                            hide_dealer
                        );
                    }
                }
                else
                {
                    const result = await this.stand(game_message, user, bet_amount);

                    collector.stop();
                    resolve(result);
                }
            });

            collector.on('end', async(collected, reason) =>
            {
                if(reason === 'time' && collected.size === 0)
                {
                    resolve(await this.handleTimeout(user, game_message));
                }
            });
        });

        if(active_items['xrv'])
            await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'xrv', 1);
        
        return result;
    }
}