import { db_manager } from "../db/db_manager.js";

class ItemManager
{
    constructor()
    {
        this.items = {
            "sc" : {
                "key": "sc",
                "name": "Second Chance Token",
                "desc": "Lasts 1 game. Grants a second chance if you lose, giving you another opportunity to win the same amount.",
                "icon": "🌀",
                "price": 5000,
                "max_uses": 1,
                "reward_tier": 2
            },
            "lc": {
                "key": "lc",
                "name": "Loss Cushion",
                "desc": "Lasts 1 game. If you lose, reduces your loss by 50%.",
                "icon": "🛡️",
                "price": 3000,
                "max_uses": 1,
                "reward_tier": 1
            },
            "jj": {
                "key": "jj",
                "name": "Jackpot Juice",
                "desc": "Lasts 1 game. If you win, doubles your winnings.",
                "icon": "💰",
                "price": 10000,
                "max_uses": 1,
                "reward_tier": 2
            },
            "cs": {
                "key": "cs",
                "name": "Carrot Surge",
                "desc": "Lasts for 5 games. If you win any of them, you earn +10% carrots on top of your winnings.",
                "icon": "⚡",
                "price": 2000,
                "max_uses": 5,
                "reward_tier": 1
            },
            "no": {
                "key": "no",
                "name": "Number Oracle",
                "desc": "Lasts 1 game. Highlights 5 numbers in Number Guess. The winning number is guaranteed to be among them.",
                "icon": "🔮",
                "price": 10000,
                "max_uses": 1,
                "reward_tier": 2
            },
            "xrv": {
                "key": "xrv",
                "name": "X-Ray Vision",
                "desc": "Lasts 1 game. Reveals the dealer's hidden card in Blackjack.",
                "icon": "👓",
                "price": 7000,
                "max_uses": 1,
                "reward_tier": 1
            }
        };

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
}

export const item_manager = new ItemManager();