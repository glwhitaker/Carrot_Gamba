import { db_manager } from "../db/db_manager.js";

class ItemManager
{
    constructor()
    {
        this.items = {
            "second_chance_token" : {
                "key": "second_chance_token",
                "name": "Second Chance Token",
                "desc": "Grants a second chance on your next lost bet, giving you another opportunity to win the same amount.",
                "icon": "🌀",
                "price": 5000,
                "max_uses": 1
            },
            "loss_cushion": {
                "key": "loss_cushion",
                "name": "Loss Cushion",
                "desc": "Reduces the amount lost on your next failed bet by 50%.",
                "icon": "🛡️",
                "price": 3000,
                "max_uses": 1
            },
            "jackpot_juice": {
                "key": "jackpot_juice",
                "name": "Jackpot Juice",
                "desc": "Doubles your winnings on your next successful game.",
                "icon": "💰",
                "price": 10000,
                "max_uses": 1
            },
            "carrot_surge": {
                "key": "carrot_surge",
                "name": "Carrot Surge",
                "desc": "Lasts for 5 games. If you win any of them, you earn +10% carrots on top of your winnings.",
                "icon": "⚡",
                "price": 7000,
                "max_uses": 5
            },
            "number_oracle": {
                "key": "number_oracle",
                "name": "Number Oracle",
                "desc": "Highlights 5 numbers in Number Guess. The winning number is guaranteed to be among them.",
                "icon": "🔮",
                "price": 10000,
                "max_uses": 1
            }
        }

        this.current_items_activated = {};
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

    async getActiveItemsForUser(user_id, guild_id)
    {
        return this.current_items_activated[`${guild_id}-${user_id}`] || {};
    }

    async consumeItemForUser(user_id, guild_id, item_key, quantity)
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
                // remove item from user's inventory
                await db_manager.removeItemFromUserInventory(user_id, guild_id, item_key, quantity);
            }
        }
    }
}

export const item_manager = new ItemManager();