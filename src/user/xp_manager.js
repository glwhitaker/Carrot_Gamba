import config from '../config.js';
import { db_manager } from '../db/db_manager.js';
import { item_manager } from '../items/item_manager.js';

class XPManager
{
    calculateXP(user, bet_amount, result)
    {
        // calculate xp gain
        const risk = Math.pow(bet_amount / user.balance, 0.8);
        const magnitude = Math.pow(bet_amount / config.BASE_BET, 0.275);
        const combined = config.XP_A * risk + (1 - config.XP_A) * magnitude;
        const raw_xp = config.BASE_XP * combined;
        const xp = Math.floor(raw_xp * (result === 'win' ? config.WIN_MULTIPLIER : config.LOSS_MULTIPLIER));

        return xp;
    }

    requiredXPForLevel(level)
    {
        const req = Math.floor(config.BASE_REQ_XP * Math.pow(level, config.XP_EXPONENT));
        return req;
    }

    getEligibleItems(level)
    {
        const TIER_UNLOCKS = {
            1: 1,
            2: 10,
            3: 25
        };
        return Object.values(item_manager.getItems()).filter(item =>
            level >= TIER_UNLOCKS[item.reward_tier]
        );
    }

    calculateItemAmount(item, level)
    {
        const base = Math.max(1, Math.ceil(level / (item.reward_tier * 10)));
        return base;
    }

    getLevelRewards(level)
    {
        const rewards = [];

        rewards.push({
            key: 'carrots',
            amount: Math.floor(level * 1000)
        });

        const eligible_items = this.getEligibleItems(level);

        for(const item of eligible_items)
        {
            const amount = this.calculateItemAmount(item, level);

            if(amount > 0)
            {
                rewards.push({
                    key: item.key,
                    amount: amount
                });
            }
        }

        return rewards;
    }

    async applyLevelRewards(user, level)
    {
        const rewards = this.getLevelRewards(level);
        for(const reward of rewards)
        {
            if(reward.key === 'carrots')
                await db_manager.updateUserBalance(user.user_id, user.guild_id, reward.amount);
            else
                await item_manager.giveItemToUser(user.user_id, user.guild_id, reward.key, reward.amount);
        }

        // give user plus 10% passive carrot gain
        await db_manager.updateUserPassiveGain(user.user_id, user.guild_id, 10);
    }
}


class XPManagerSingleton
{
    constructor()
    {
        if(!XPManagerSingleton.instance)
        {
            XPManagerSingleton.instance = new XPManager();
        }
    }

    getInstance()
    {
        return XPManagerSingleton.instance;
    }
}

export const xp_manager = new XPManagerSingleton().getInstance();