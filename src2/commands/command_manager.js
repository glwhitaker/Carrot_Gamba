import { handleDefault } from './default.js';
import { handleEnroll } from './enroll.js';
import { handleBalance } from './balance.js';
import { handleDaily } from './daily.js';
import { handleWeekly } from './weekly.js';
import { handleDonate } from './donate.js';
import { handleGamba } from './gamba.js';
import { handleUse } from './use.js';
import { handleStats } from './stats.js';
import { handleHelp } from './help.js';
import { handleLeaderboard } from './leaderboard.js';

// commandManager singleton to manage commands
class CommandManager
{
    constructor()
    {
        this.commands = 
        {
            economy:
            {
                enroll:
                {
                    execute: handleEnroll,
                    description: 'Join the carrot economy',
                    usage: '^enroll',
                    aliases: []
                },
                balance:
                {
                    execute: handleBalance,
                    description: 'Check your carrot balance',
                    usage: '^carrots, ^bal',
                    aliases: ['carrots', 'bal']
                },
                daily:
                {
                    execute: handleDaily,
                    description: 'Claim your daily reward',
                    usage: '^daily',
                    aliases: []
                },
                weekly:
                {
                    execute: handleWeekly,
                    description: 'Claim your weekly reward',
                    usage: '^weekly',
                    aliases: []
                },
                donate:
                {
                    execute: handleDonate,
                    description: 'Donate carrots to another user',
                    usage: '^donate <@user> <amount>',
                    aliases: []
                }
            },
            games:
            {
                gamba:
                {
                    execute: handleGamba,
                    description: 'Play games to win carrots',
                    usage: '^gamba <game> <bet amount|"max">',
                    aliases: []
                }
            },
            utility:
            {
                leaderboard:
                {
                    execute: handleLeaderboard,
                    description: 'View top players',
                    usage: '^leaderboard, ^lb',
                    aliases: ['leaderboard', 'lb']
                },
                
                help:
                {
                    execute: handleHelp,
                    description: 'Show all available commands',
                    usage: '^help [category|command]',
                    aliases: []
                },
                stats:
                {
                    execute: handleStats,
                    description: 'View gamba statistics',
                    usage: '^stats [me|@user|games <game>]',
                    aliases: []
                }
            },
            items:
            {
                inventory:
                {
                    // execute: handleInventory,
                    description: 'View your item inventory',
                    usage: '^inventory, ^inv',
                    aliases: ['inventory', 'inv']
                },

                use:
                {
                    execute: handleUse,
                    description: 'Use an item from your inventory',
                    usage: '^use <item_key>',
                    aliases: []
                }
            }
        };
    }

    getAllCommands()
    {
        return this.commands;
    }

    getCategories()
    {
        return Object.keys(this.commands);
    }

    getCommandsByCategory(category)
    {
        return this.commands[category] || null;
    }

    getCommand(command_name)
    {
        const commands = this.commands;
        for(const cat in commands)
        {
            const category = commands[cat];
            if(category[command_name])
                return category[command_name];

            // check for aliases
            for(const command in category)
            {
                if(category[command].aliases && category[command].aliases.includes(command_name))
                    return category[command];
            }
        }

        return null;
    }

    async executeCommand(command_name, args, message)
    {
        const command = this.getCommand(command_name);
        try
        {
            if(command && command.execute)
            {
                await command.execute(args, message, command.usage);
            }
            else
            {
                await handleDefault(message, 'Invalid command. Use \`^help\` to see available commands.');
            }
        }
        catch(error)
        {
            // trace error
            console.error(`Error executing command ${command_name}:`, error);
            console.error(error.stack);
            await handleDefault(message, 'Unable to process your request. Try again later.');
        }
        
    }
}

class CommandManagerSingleton
{
    constructor()
    {
        if(!CommandManagerSingleton.instance)
        {
            CommandManagerSingleton.instance = new CommandManager();
        }
    }

    getInstance()
    {
        return CommandManagerSingleton.instance;
    }
}

export const command_manager = new CommandManagerSingleton().getInstance();