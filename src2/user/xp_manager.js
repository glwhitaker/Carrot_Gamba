import config from '../config.js';
import { db_manager } from '../db/db_manager.js';
import { item_manager } from '../items/item_manager.js';

class XPManager
{
    calculateXP(user, bet_amount, result)
    {
        const clamp = function(num, min, max)
        {
            return Math.max(min, Math.min(max, num));
        }

        // calculate xp gain
        const p = clamp(bet_amount / Math.max(user.balance, 1), 0, 1);
        const m = clamp(Math.sqrt(bet_amount) / Math.sqrt(config.BASE_BET), 0, 1);

        const raw = config.XP_A * p + (1 - config.XP_A) * m;
        const s = 1 + Math.log10(bet_amount + 1);

        const raw_xp = config.BASE_XP * raw * s;

        const xp = Math.floor(raw_xp * (result === 'win' ? config.WIN_MULTIPLIER : config.LOSS_MULTIPLIER));

        return xp;
    }

    requiredXPForLevel(level)
    {
        const req = Math.floor(config.BASE_REQ_XP * Math.pow(level, config.XP_EXPONENT));
        return req;
    }

    getLevelRewards(level)
    {
        const rewards = [];
        rewards.push({type: 'carrots', amount: level * 1000});
        return rewards;
    }

    async applyLevelRewards(user, level)
    {
        const rewards = this.getLevelRewards(level);
        for(const reward of rewards)
        {
            if(reward.type === 'carrots')
                await db_manager.updateUserBalance(user.user_id, user.guild_id, reward.amount);
            else
                await item_manager.giveItemToUser(user.user_id, user.guild_id, reward.type, reward.amount);
        }
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