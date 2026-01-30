import { db_manager } from "../db/db_manager.js";
import config from "../config.js";

class ItemManager
{
    constructor()
    {
        this.items = {
            "sc" : {
                "key": "sc",
                "name": "Second Chance Token",
                "desc": "Lasts 1 game. Grants a second chance if you lose, but if you win on the second chance, your winnings are halved.",
                "icon": "🌀",
                "price": 5000,
                "max_uses": 1,
                "tier": 3
            },
            "lc": {
                "key": "lc",
                "name": "Loss Cushion",
                "desc": "Lasts 1 game. If you lose, reduces your loss by 50%.",
                "icon": "🛡️",
                "price": 3000,
                "max_uses": 1,
                "tier": 1
            },
            "jj": {
                "key": "jj",
                "name": "Jackpot Juice",
                "desc": "Lasts 1 game. If you win, doubles your winnings.",
                "icon": "💰",
                "price": 10000,
                "max_uses": 1,
                "tier": 2
            },
            "cs": {
                "key": "cs",
                "name": "Carrot Surge",
                "desc": "Lasts for 5 games. If you win any of them, you earn +10% carrots on top of your winnings.",
                "icon": "⚡",
                "price": 2000,
                "max_uses": 5,
                "tier": 1
            },
            "no": {
                "key": "no",
                "name": "Number Oracle",
                "desc": "Lasts 1 game. Highlights 5 numbers in Number Guess. The winning number is guaranteed to be among them.",
                "icon": "🔮",
                "price": 10000,
                "max_uses": 1,
                "tier": 2
            },
            "xrv": {
                "key": "xrv",
                "name": "X-Ray Vision",
                "desc": "Lasts 1 game. Reveals the dealer's hidden card in Blackjack.",
                "icon": "👓",
                "price": 7000,
                "max_uses": 1,
                "tier": 2
            }
        };

        this.boxes = config.ITEMS.BOXES;
        this.tiers = config.ITEMS.TIERS;

        for(let i = 0; i < 5; i++)
        {
            let res = this.rollCrate(`c${i+1}`);
        }

        this.current_items_activated = {};
    }

    getItems()
    {
        return this.items;
    }

    getItem(item_key)
    {
        return this.items[item_key];
    }

    getCrate(crate_key)
    {
        return this.boxes[crate_key];
    }

    async giveCrateToUser(user_id, guild_id, crate_key, quantity)
    {
        if(!quantity)
            quantity = 1;
        const crate = this.boxes[crate_key];
        await db_manager.addItemToUserInventory(user_id, guild_id, crate, quantity);
    }

    async giveItemToUser(user_id, guild_id, item_key, quantity)
    {
        if(!quantity)
            quantity = 1;
        const item = this.items[item_key];
        await db_manager.addItemToUserInventory(user_id, guild_id, item, quantity);
    }

    async getUserItems(user_id, guild_id)
    {
        const user_items = await db_manager.getUserItems(user_id, guild_id);
        return user_items;
    }

    getActiveItemsForUser(user_id, guild_id)
    {
        return this.current_items_activated[`${guild_id}-${user_id}`] || {};
    }

    async consumeActiveItemForUser(user_id, guild_id, item_key, quantity)
    {
        if(!quantity)
            quantity = 1;

        // remove item from active items
        if(this.current_items_activated[`${guild_id}-${user_id}`][item_key])
        {
            this.current_items_activated[`${guild_id}-${user_id}`][item_key] -= quantity;
            if(this.current_items_activated[`${guild_id}-${user_id}`][item_key] <= 0)
            {
                delete this.current_items_activated[`${guild_id}-${user_id}`][item_key];
                
            }
        }
    }

    async consumeItemForUser(user_id, guild_id, item_key, quantity)
    {
        if(!quantity)
            quantity = 1;

        // remove item from user's inventory
        await db_manager.removeItemFromUserInventory(user_id, guild_id, item_key, quantity);
    }

    rollCrate(crate_key)
    {
        const crate = this.boxes[crate_key];
        const results = [];

        for(let i = 0; i < crate.rolls; i++)
        {
            // roll for tier
            const tier = this.rollTier(crate);

            // roll for item in tier
            const tier_config = this.tiers[tier];
            const item_key = this.rollItemFromTier(tier_config);

            results.push(item_key);
        }

        return results;
    }

    rollTier(crate_config)
    {
        return this.weightedRoll(crate_config.tier_weights);
    }

    rollItemFromTier(tier_config)
    {
        return this.weightedRoll(tier_config.items);
    }

    weightedRoll(weight_map)
    {
        const entries = Object.entries(weight_map);
        const total_weight = entries.reduce((sum, [, value]) => sum + value, 0);
        let roll = Math.floor(Math.random() * total_weight) + 1;

        for(const [key, weight] of entries)
        {
            if(roll <= weight)
                return key;
            roll -= weight;
        }
    }
}

export const item_manager = new ItemManager();