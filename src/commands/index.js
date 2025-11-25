import { handleEnroll } from './enroll.js';
import { handleBalance } from './balance.js';
import { handleGamble } from './gamble.js';
import { handleLeaderboard } from './leaderboard.js';
import { handleDaily } from './daily.js';
import { handleWeekly } from './weekly.js';
import { handleDonate } from './donate.js';
import { handleHelp } from './help.js';
import { handleStats } from './stats.js';

export const commands = {
    enroll: {
        execute: handleEnroll,
        description: 'Join the carrot economy',
        usage: '^enroll',
        category: 'economy'
    },
    balance: {
        execute: handleBalance,
        description: 'Check your carrot balance',
        usage: '^carrots',
        aliases: ['carrots', 'bal'],
        category: 'economy'
    },
    gamba: {
        execute: handleGamble,
        description: 'Play games to win carrots',
        usage: '^gamba <game> <bet|max>',
        category: 'games'
    },
    leaderboard: {
        execute: handleLeaderboard,
        description: 'View top players by balance',
        usage: '^leaderboard',
        aliases: ['leaderboard', 'lb'],
        category: 'utility'
    },
    daily: {
        execute: handleDaily,
        description: 'Claim your daily reward',
        usage: '^daily',
        category: 'economy'
    },
    weekly: {
        execute: handleWeekly,
        description: 'Claim your weekly reward',
        usage: '^weekly',
        category: 'economy'
    },
    donate: {
        execute: handleDonate,
        description: 'Donate carrots to another user',
        usage: '^donate <@user> <amount>',
        category: 'economy'
    },
    help: {
        execute: handleHelp,
        description: 'Show all available commands',
        usage: '^help [category|command]',
        category: 'utility'
    },
    stats: {
        execute: handleStats,
        description: 'View gamba statistics',
        usage: '^stats [me|@user|games <game>]',
        category: 'utility'
    }
}

// utility functions for command registry
export function getCommand(name) {
    if (commands[name]) {
        return commands[name];
    }

    // check for aliases
    for (const [cmdName, cmd] of Object.entries(commands)) {
        if (cmd.aliases && cmd.aliases.includes(name)) {
            return cmd;
        }
    }

    return null;
}

export function getAllCommands() {
    return commands;
}

export function getCommandsByCategory() {
    const categories = {};

    for (const [cmdName, cmd] of Object.entries(commands)) {
        const category = cmd.category || 'misc';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ name: cmdName, ...cmd});
    }

    return categories;
}