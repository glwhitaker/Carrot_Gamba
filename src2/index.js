import dotenv from 'dotenv';
import config from './config.js';

import { command_manager } from './commands/command_manager.js';
import { db_manager } from './db/db_manager.js';
import { Client, GatewayIntentBits, ChannelType, ActivityType } from 'discord.js';

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

initialize();

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

    // check guilds for active voice channels and start a voice session
    client.guilds.cache.forEach(guild =>
    {
        guild.channels.cache.forEach(channel =>
        {
            // is voice channel and currently has members
            if(channel.type === ChannelType.GuildVoice && channel.members.size > 0)
            {
                console.log(`[System] Active voice channel found in guild ${guild.name}: ${channel.name}`);
            }
        });
    });

    // interval to sync cache with database
    // setInterval(async () =>
    // {
    //     await db_manager.updateAllUsers();
    // }, 30000);
});

// listener for messages
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