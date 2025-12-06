import { CoinToss } from './CoinToss.js';

class GameManager
{
    constructor()
    {
        this.gameClasses = new Map();
        this.registerGames();
    }

    registerGames()
    {
        this.gameClasses.set('cointoss', CoinToss);
    }

    getGame(name)
    {
        const GameClass = this.gameClasses.get(name.toLowerCase());
        if(!GameClass) return null;
        return new GameClass();
    }

    listGames()
    {
        return Array.from(this.gameClasses.keys());
    }
}

class GameManagerSingleton
{
    constructor()
    {
        if(!GameManagerSingleton.instance)
        {
            GameManagerSingleton.instance = new GameManager();
        }
    }

    getInstance()
    {
        return GameManagerSingleton.instance;
    }
}

export const game_manager = new GameManagerSingleton().getInstance();