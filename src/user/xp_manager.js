import config from '../config.js';
import { db_manager } from '../db/db_manager.js';
import { item_manager } from '../items/item_manager.js';

class XPManager
{
    calculateXP(user, bet_amount, result)
    {
        // risk score, gaussian function for risk (highest at mu, falls off with sigma)
        const risk = Math.min(1, bet_amount / user.balance);
        const risk_score = Math.exp(-((risk - config.LEVELING.MU) ** 2) / (2 * (config.LEVELING.SIGMA ** 2)));

        // magnitude with strong falloff for protection against huge bets
        const magnitude = Math.pow(Math.log10(bet_amount / config.LEVELING.BASE_BET + 1), 0.8);

        const combined = config.LEVELING.XP_A * risk_score + (1 - config.LEVELING.XP_A) * magnitude;

        const raw_xp = config.LEVELING.BASE_XP * (1 + combined * config.LEVELING.SCALE_MULTIPLIER);

        let xp = Math.floor(raw_xp * (result.result === 'win' ? config.LEVELING.WIN_MULTIPLIER : config.LEVELING.LOSS_MULTIPLIER));

        const xp_cap = this.requiredXPForLevel(user.progression.level) * config.LEVELING.SOFT_CAP_PERCENTAGE;

        if(xp > xp_cap)
        {
            const overflow = xp - xp_cap;
            xp = Math.floor(xp_cap + overflow * config.LEVELING.OVERFLOW_REDUCTION);
        }

        return xp;
    }

    requiredXPForLevel(level)
    {
        const req = Math.floor(config.LEVELING.BASE_REQ_XP * Math.pow(level, config.LEVELING.XP_EXPONENT));
        return req;
    }

    getHighestUnlockedCrate(level)
    {
        const CRATE_UNLOCKS = {
            "c1": 1,
            "c2": 10,
            "c3": 25,
            "c4": 50,
            "c5": 75
        };

        let highest_crate = 'c1';
        for(const [crate_key, unlock_level] of Object.entries(CRATE_UNLOCKS))
        {
            if(level >= unlock_level)
                highest_crate = crate_key;
        }

        return highest_crate;
    }

    getCrateAmount(level)
    {
        if(level < 10) return 1;
        if(level < 20) return 2;
        if(level < 30) return 3;
        if(level < 40) return 4;
        if(level < 50) return 5;
        if(level < 60) return 6;
        if(level < 70) return 7;
        if(level < 80) return 8;
        if(level < 90) return 9;
        return 10;
    }

    getCrateRatiosForLevel(level)
    {
        const ratios = {
            10: {'c1': 1.0},
            20: {'c1': 0.5, 'c2': 0.5},
            30: {'c1': 0.5, 'c2': 0.4, 'c3': 0.1},
            40: {'c2': 0.5, 'c3': 0.3, 'c4': 0.1},
            50: {'c2': 0.3, 'c3': 0.5, 'c4': 0.2},
            60: {'c3': 0.5, 'c4': 0.4, 'c5': 0.1},
            70: {'c3': 0.3, 'c4': 0.5, 'c5': 0.2},
            80: {'c4': 0.5, 'c5': 0.5},
            90: {'c4': 0.3, 'c5': 0.7},
            100: {'c5': 1.0}
        }

        // find closest level not exceeding current level
        for(let lvl = level; lvl >= 10; lvl--)
        {
            if(ratios[lvl])
                return ratios[lvl];
        }

        return ratios[10];
    }

    getLevelRewards(level)
    {
        const rewards = [];

        rewards.push({
            key: 'carrots',
            amount: Math.floor(level * 1000)
        });

        const crate_amount = this.getCrateAmount(level);
        const ratios = this.getCrateRatiosForLevel(level);
        
        const entries = Object.entries(ratios);

        // raw fracitonal amounts
        const raw_amounts = entries.map(([crate_key, ratio]) => ({crate_key, amount: ratio * crate_amount}));

        // floor allocation
        let total_allocated = 0;
        for(const entry of raw_amounts)
        {
            const count = Math.floor(entry.amount);
            if(count > 0)
            {
                rewards.push({
                    key: entry.crate_key,
                    amount: count
                });
                total_allocated += count;
            }
        }

        // distribute remaining crates based on highest fractional parts
        let remaining = crate_amount - total_allocated;
        if(remaining > 0)
        {
            // sort by fractional part descending
            raw_amounts.sort((a, b) => (b.amount - Math.floor(b.amount)) - (a.amount - Math.floor(a.amount)));

            for(const entry of raw_amounts)
            {
                if(remaining <= 0)
                    break;

                const fractional_part = entry.amount - Math.floor(entry.amount);
                if(fractional_part > 0)
                {
                    // check if already in rewards
                    const existing_reward = rewards.find(r => r.key === entry.crate_key);
                    if(existing_reward)
                    {
                        existing_reward.amount += 1;
                    }
                    else
                    {
                        rewards.push({
                            key: entry.crate_key,
                            amount: 1
                        });
                    }
                    remaining -= 1;
                }
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
                await item_manager.giveCrateToUser(user.user_id, user.guild_id, reward.key, reward.amount);
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