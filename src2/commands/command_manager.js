import { handleDefault } from './default.js';
import { handleEnroll } from './enroll.js';
import { handleBalance } from './balance.js';
import { handleDaily } from './daily.js';
import { handleWeekly } from './weekly.js';
import { handleDonate } from './donate.js';

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
                    usage: '^enroll'
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
                    usage: '^daily'
                },
                weekly:
                {
                    execute: handleWeekly,
                    description: 'Claim your weekly reward',
                    usage: '^weekly'
                },
                donate:
                {
                    execute: handleDonate,
                    description: 'Donate carrots to another user',
                    usage: '^donate <@user> <amount>'
                }
            },
            games:
            {
                gamba:
                {
                    // execute: handleGamble,
                    description: 'Play games to win carrots',
                    usage: '^gamba <game> [bet|"max"]'
                }
            },
            utility:
            {
                leaderboard:
                {
                    // execute: handleLeaderboard,
                    description: 'View top players',
                    usage: '^leaderboard, ^lb',
                    aliases: ['leaderboard', 'lb']
                },
                
                help:
                {
                    // execute: handleHelp,
                    description: 'Show all available commands',
                    usage: '^help [category|command]'
                },
                stats:
                {
                    // execute: handleStats,
                    description: 'View gamba statistics',
                    usage: '^stats [me|@user|games <game>]'
                }
            }
        };
    }

    getAllCommands()
    {
        return this.commands;
    }

    getCommandByCategory(category)
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
            console.log(`[Error] ${error}`);
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