import { CoinToss } from './CoinToss.js';
import { BlackJack } from './Blackjack.js';
import { NumberGuess } from './NumberGuess.js';

class GameManager {
    constructor() {
        this.gameClasses = new Map();
        this.registerGames();
    }

    registerGames() {
        // Store the classes instead of instances
        this.gameClasses.set('cointoss', CoinToss);
        this.gameClasses.set('blackjack', BlackJack);
        this.gameClasses.set('numberguess', NumberGuess);
        // add more games here
    }

    getGame(name) {
        const GameClass = this.gameClasses.get(name.toLowerCase());
        if (!GameClass) return null;
        return new GameClass(); // Create a new instance each time
    }

    listGames() {
        return Array.from(this.gameClasses.keys());
    }
}

export const gameManager = new GameManager();
