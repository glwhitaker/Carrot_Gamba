import { db_manager } from "../db/db_manager.js";

class ItemManager
{
    constructor()
    {
        this.items = {
        "second_chance_token":
            {
                "name": "Second Chance Token",
                "desc": "Grants a second chance on a lost bet, giving you another opportunity to win the same amount.",
                "price": 5000,
                "type": "post_game"
            }
        }
    }

    getItem(item_key)
    {
        return this.items[item_key] || null;
    }

    async giveItemToUser(user_id, guild_id, item_key, quantity)
    {
        if(!quantity)
            quantity = 1;

        await db_manager.addItemToUserInventory(user_id, guild_id, item_key, quantity);
    }
}

export const item_manager = new ItemManager();