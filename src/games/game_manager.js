import { CoinToss } from './CoinToss.js';
import { NumberGuess } from './NumberGuess.js';
import { Blackjack } from './Blackjack.js';
import { Mines } from './Mines.js';

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
        this.gameClasses.set('numberguess', NumberGuess);
        this.gameClasses.set('blackjack', Blackjack);
        this.gameClasses.set('mines', Mines);
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