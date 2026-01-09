import dotenv from 'dotenv';
import config from './config.js';

import { db_manager } from './db/db_manager.js';
import { command_manager } from './commands/command_manager.js';
import { activity_tracker } from './user/activity_tracker.js';
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';

dotenv.config();

// configure discord client
const client = new Client(
{
    intents:
    [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

// init bot
async function initialize()
{
    try
    {
        await client.login(process.env.DISCORD_BOT_TOKEN);

        console.log('[System] Discord client logged in.');
    }
    catch(error)
    {
        console.error('[Error] Error during initialization:', error);
        process.exit(1);
    }
}

async function shutdown()
{
    console.log('\n[System] Shutting down...');

    try
    {
        // update all users before shutdown
        await db_manager.updateAllUsers();
        console.log('[Database] Database synced.');

        await db_manager.close();
        console.log('[Database] Database connection closed.');

        await client.destroy();
        console.log('[System] Discord client closed. Goodbye!');
        
        process.exit(0);
    }
    catch(error)
    {
        console.error('[Error] Error during shutdown:', error);
        process.exit(1);
    }
}

// listen for ready event
client.once('clientReady', () =>
{
    console.log('[System] Logged in as ' + client.user.tag + "\n");

    client.user.setPresence(
    {
        status: 'dnd',
        activities: [
            {
                name: "maintenance mode"
            }
        ]
    });
    
    // set activity tracker
    activity_tracker.getInstance().init(client);

    // interval to sync cache with database
    setInterval(async () =>
    {
        await db_manager.updateAllUsers();
    }, 30000);
});

// listener for commands
client.on('messageCreate', async (message) =>
{
    if(message.author.bot) return;

    if(!message.content.startsWith(config.COMMAND_PREFIX)) return;

    // parse command and args
    const full_command = message.content.slice(config.COMMAND_PREFIX.length).trim().split(/\s+/);
    const command_name = full_command[0].toLowerCase();
    const args = full_command.slice(1);

    command_manager.executeCommand(command_name, args, message);
});

initialize();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);