import { Game } from './Game.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { item_manager } from '../items/item_manager.js';

export class Blackjack extends Game
{
    constructor()
    {
        super('blackjack');
        this.deck = [];
        this.cards ={
            cA: { code: '<:cardClubs_A:1460058607491092702>', value: 'A' },
            c2: { code: '<:cardClubs_2:1460058514532733080>', value: '2' },
            c3: { code: '<:cardClubs_3:1460058515858260050>', value: '3' },
            c4: { code: '<:cardClubs_4:1460058518726901822>', value: '4' },
            c5: { code: '<:cardClubs_5:1460058520035524843>', value: '5' },
            c6: { code: '<:cardClubs_6:1460058521046356212>', value: '6' },
            c7: { code: '<:cardClubs_7:1460058522292195369>', value: '7' },
            c8: { code: '<:cardClubs_8:1460058523500154900>', value: '8' },
            c9: { code: '<:cardClubs_9:1460058524414382221>', value: '9' },
            c10: { code: '<:cardClubs_10:1460058525253238867>', value: '10' },
            cJ: { code: '<:cardClubs_J:1460058529514782944>', value: 'J' },
            cK: { code: '<:cardClubs_K:1460058531997941821>', value: 'K' },
            cQ: { code: '<:cardClubs_Q:1460058582140850391>', value: 'Q' },
            
            dA: { code: '<:cardDiamonds_A:1460058658934100155>', value: 'A' },
            d2: { code: '<:cardDiamonds_2:1460058648033366136>', value: '2' },
            d3: { code: '<:cardDiamonds_3:1460058649304236164>', value: '3' },
            d4: { code: '<:cardDiamonds_4:1460058650503544832>', value: '4' },
            d5: { code: '<:cardDiamonds_5:1460058651413839974>', value: '5' },
            d6: { code: '<:cardDiamonds_6:1460058652252569643>', value: '6' },
            d7: { code: '<:cardDiamonds_7:1460058653196288213>', value: '7' },
            d8: { code: '<:cardDiamonds_8:1460058654777802885>', value: '8' },
            d9: { code: '<:cardDiamonds_9:1460058656228769792>', value: '9' },
            d10: { code: '<:cardDiamonds_10:1460058694644535428>', value: '10' },
            dJ: { code: '<:cardDiamonds_J:1460058695877791840>', value: 'J' },
            dK: { code: '<:cardDiamonds_K:1460058662608568371>', value: 'K' },
            dQ: { code: '<:cardDiamonds_Q:1460058693620994132>', value: 'Q' },
            
            hA: { code: '<:cardHearts_A:1460058776102109236>', value: 'A' },
            h2: { code: '<:cardHearts_2:1460058719852298240>', value: '2' },
            h3: { code: '<:cardHearts_3:1460058721106268324>', value: '3' },
            h4: { code: '<:cardHearts_4:1460058722314358966>', value: '4' },
            h5: { code: '<:cardHearts_5:1460058723677376676>', value: '5' },
            h6: { code: '<:cardHearts_6:1460058724910764271>', value: '6' },
            h7: { code: '<:cardHearts_7:1460058726190026804>', value: '7' },
            h8: { code: '<:cardHearts_8:1460058729163657469>', value: '8' },
            h9: { code: '<:cardHearts_9:1460058730937847913>', value: '9' },
            h10: { code: '<:cardHearts_10:1460058731999002805>', value: '10' },
            hJ: { code: '<:cardHearts_J:1460058734381502595>', value: 'J' },
            hQ: { code: '<:cardHearts_Q:1460058738089267400>', value: 'Q' },
            hK: { code: '<:cardHearts_K:1460058775091150908>', value: 'K' },
            
            sA: { code: '<:cardSpades_A:1460058817214677228>', value: 'A' },
            s2: { code: '<:cardSpades_2:1460058806066352239>', value: '2' },
            s3: { code: '<:cardSpades_3:1460058807353737439>', value: '3' },
            s4: { code: '<:cardSpades_4:1460058808175820802>', value: '4' },
            s5: { code: '<:cardSpades_5:1460058810163920917>', value: '5' },
            s6: { code: '<:cardSpades_6:1460058811103580394>', value: '6' },
            s7: { code: '<:cardSpades_7:1460058811984248986>', value: '7' },
            s8: { code: '<:cardSpades_8:1460058812898873598>', value: '8' },
            s9: { code: '<:cardSpades_9:1460058814215622729>', value: '9' },
            s10: { code: '<:cardSpades_10:1460074779737587898>', value: '10' },
            sJ: { code: '<:cardSpades_J:1460074780802945176>', value: 'J' },
            sQ: { code: '<:cardSpades_Q:1460074782518280192>', value: 'Q' },
            sK: { code: '<:cardSpades_K:1460069132048404584>', value: 'K' },
            
            back: { code: '<:cardBackRed:1460069134741016576>', value: '0' }
        };
        this.dealer_hand = [];
        this.player_hand = [];
    }

    createDeck()
    {
        this.deck = [];
        this.player_hand = [];
        this.dealer_hand = [];
        // create a standard 52-card deck
        for(const key in this.cards)
        {
            if(key !== 'back')
            {
                this.deck.push(this.cards[key]);
            }
        }

        // shuffle the deck
        for(let i = this.deck.length - 1; i > 0; i--)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCard(hand)
    {
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

    async update_game_message(game_message, username, bet_amount, player_value, dealer_value, hide_dealer)
    {
        await game_message.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackMessage(
                    username,
                    this.player_hand,
                    this.dealer_hand,
                    bet_amount,
                    this.cards,
                    player_value,
                    dealer_value,
                    hide_dealer
                )
            ]
        });
    }

    async update_result_message(game_message, username, bet_amount, player_value, dealer_value, result)
    {
        await game_message.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackResultMessage(
                    username,
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

    async stand(game_message, username, bet_amount)
    {
        let res = {};

        const player_value = this.calculateHandValue(this.player_hand);
        let dealer_value = this.calculateHandValue(this.dealer_hand);

        await this.update_game_message(
            game_message,
            username,
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
                username,
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
                username,
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
                username,
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
                username,
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

        this.createDeck();
        this.dealCard(this.player_hand);
        this.dealCard(this.dealer_hand);
        this.dealCard(this.player_hand);
        this.dealCard(this.dealer_hand);

        const player_value = this.calculateHandValue(this.player_hand);
        const dealer_value = this.calculateHandValue(this.dealer_hand);

        // if x-ray vision item used, reveal dealer's hidden card
        let hide_dealer = true;
        const active_items = await item_manager.getActiveItemsForUser(user.user_id, user.guild_id);
        if(active_items['xrv'])
        {
            hide_dealer = false;
            await item_manager.consumeActiveItemForUser(user.user_id, user.guild_id, 'xrv', 1);
        }

        const game_message = await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [
                MessageTemplates.blackjackMessage(
                    username,
                    this.player_hand,
                    this.dealer_hand,
                    bet_amount,
                    this.cards,
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
                username,
                bet_amount,
                player_value,
                dealer_value,
                false
            );

            if(dealer_value === 21)
            {
                await this.update_result_message(
                    game_message,
                    username,
                    bet_amount,
                    player_value,
                    dealer_value,
                    'push'
                );

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
                username,
                bet_amount,
                player_value,
                dealer_value,
                'win'
            );

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

        return await new Promise((resolve) =>
        {
            collector.on('collect', async (interaction) =>
            {
                await interaction.deferUpdate();

                const hit_or_stand = interaction.customId.split('_')[1];

                if(hit_or_stand === 'hit')
                {
                    this.dealCard(this.player_hand);
                    const player_value = this.calculateHandValue(this.player_hand);

                    if(player_value > 21)
                    {
                        await this.update_result_message(
                            game_message,
                            username,
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
                        const result = await this.stand(game_message, username, bet_amount);
                        collector.stop();
                        resolve(result);
                    }
                    else
                    {
                        await this.update_game_message(
                            game_message,
                            username,
                            bet_amount,
                            player_value,
                            dealer_value,
                            hide_dealer
                        );
                    }
                }
                else
                {
                    const result = await this.stand(game_message, username, bet_amount);
                    collector.stop();
                    resolve(result);
                }
            });
        });
    }
}