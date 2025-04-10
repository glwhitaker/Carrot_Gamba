import dotenv from 'dotenv';
import { Client, GatewayIntentBits, ChannelType, ActivityType } from 'discord.js';

// database
import { initializeDatabase, getDatabase, isUserEnrolled, updateUserBalance, resetAllDailyTimers, initializeExistingUsers } from './database/db.js';

// commands
import { getCommand, getAllCommands } from './commands/index.js';
import { handleDefault } from './commands/default.js';
import { COMMAND_PREFIX } from './utils/constants.js';


// utils
import { activityTracker } from './utils/activityTracker.js';
import { REWARDS } from './utils/rewardConfig.js';

// load environment variables
dotenv.config();

// initialize the client
// intents are the permissions of the bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
});

// start the bot
// initialize the database and log in to discord
async function startBot() {
    try {
        await initializeDatabase();
        // await initializeExistingUsers();
        console.log('Database initialized successfully');

        // // reset all daily timers
        // await resetAllDailyTimers();
        // console.log('Daily timers reset successfully');

        // log in to discord
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

// Handle clean shutdown
async function handleShutdown() {
    console.log('\nGracefully shutting down...');
    
    try {
        // Clear any intervals first
        clearInterval(voiceRewardInterval);
        clearInterval(trackingCleanupInterval);
        clearInterval(statsLoggingInterval);
        
        // Set bot status to offline and wait for it
        if (client.user) {
            client.user.setPresence({
                status: 'invisible',
                activities: []
            });
        }

        // End all active voice sessions
        client.guilds.cache.forEach(guild => {
            guild.channels.cache.forEach(channel => {
                if (channel.type === ChannelType.GuildVoice) {
                    channel.members.forEach(member => {
                        activityTracker.endVoiceSession(member.id, guild.id);
                    });
                }
            });
        });

        // Destroy the client connection and wait for it
        await client.destroy();
        
        // Close the database connection last and wait for it
        const db = getDatabase();
        await db.close();
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// event listener for when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ 
            name: "gambling addicts",
            type: ActivityType.Listening  // 2 is "Listening to"
        }],
        status: 'online'
    });

    // check all guilds for voice channels
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            // check if it's a voice channel and has members
            if (channel.type === 2 && channel.members.size > 0) {
                channel.members.forEach(member => {
                    // initialize voice session for each member
                    activityTracker.startVoiceSession(
                        member.id,
                        guild.id,
                        channel.members.size
                    )
                })
            }
        });
    });
});

// listener for command events
client.on('messageCreate', async (message) => {
    try {
        // ignore messages from bots and messages that don't start with the command prefix
        if (message.author.bot || !message.content.startsWith(COMMAND_PREFIX)) return;

        // parse the command name and arguments
        const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        // get the command from the command registry
        const command = getCommand(commandName);

        try {
            if (command) {
                // execute command if found
                await command.execute(message, args);
            }
            else {
                // handle unknown command
                await handleDefault(message);
            }
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply('An error occurred while executing that command. Please try again later.');
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
});

// listener for message events to earn points
client.on('messageCreate', async (message) => {
    // ignore bot messages and commands
    if (message.author.bot || message.content.startsWith(COMMAND_PREFIX)) return;

    try {
        if (await isUserEnrolled(message.author.id, message.guild.id)) {
            // check if message qualifies for points
            if (!activityTracker.isValidMessage(message.content)) return;
            if (!activityTracker.canEarnMessagePoints(message.author.id, message.guild.id)) return;

            // award points using updateUserBalance
            const result = await updateUserBalance(
                message.author.id,
                message.guild.id,
                REWARDS.MESSAGE.POINTS,
                'Message activity reward'
            );

            if (!result.success) {
                console.error('Failed to award message points:', result.error);
                return;
            }

            // Update last message date
            const db = getDatabase();
            await db.run(
                'UPDATE users SET last_message_date = CURRENT_TIMESTAMP WHERE user_id = ? AND guild_id = ?',
                [message.author.id, message.guild.id]
            );
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

// Enhanced voice state update handler
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.member.user.id;
    const guildId = newState.guild.id;
    
    // User switched channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        activityTracker.endVoiceSession(userId, guildId);
        activityTracker.startVoiceSession(userId, guildId, newState.channel.members.size);
    }
    // User joined a voice channel
    else if (!oldState.channelId && newState.channelId) {
        activityTracker.startVoiceSession(userId, guildId, newState.channel.members.size);
    }
    // User left a voice channel
    else if (oldState.channelId && !newState.channelId) {
        activityTracker.endVoiceSession(userId, guildId);
    }
});

// Modified voice reward interval
const voiceRewardInterval = setInterval(async () => {
    try {
        for (const [guildId, guild] of client.guilds.cache) {
            for (const [channelId, channel] of guild.channels.cache) {
                if (channel.type === ChannelType.GuildVoice) {
                    const channelUserCount = channel.members.size;
                    
                    for (const [memberId, member] of channel.members) {
                        try {
                            // Only two checks: user must be online and not muted/deafened
                            if (!member.presence?.status || member.presence.status !== 'online') {
                                continue;
                            }

                            // Skip if user is muted or deafened
                            if (member.voice.mute || member.voice.deaf) {
                                continue;
                            }

                            // Skip if user is not enrolled
                            const enrolled = await isUserEnrolled(memberId, guildId);
                            if (!enrolled) {
                                continue;
                            }
                            
                            // Simple voice activity update - just get points
                            const points = activityTracker.updateVoiceActivity(
                                memberId, 
                                guildId, 
                                channelUserCount
                            );

                            if (points > 0) {
                                console.log(`Awarding ${points} points to ${member.user.username}`);
                                const result = await updateUserBalance(
                                    memberId, 
                                    guildId, 
                                    points, 
                                    'Voice activity reward'
                                );
                                if (!result.success) {
                                    console.error(`Failed to award voice points to ${member.user.username}:`, result.error);
                                }
                            }
                        } catch (memberError) {
                            console.error(`Error processing member ${memberId}:`, memberError);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in voice reward interval:', error);
    }
}, 60000);

// Add tracking data cleanup interval (every hour)
const trackingCleanupInterval = setInterval(() => {
    try {
        console.log('[System] Running scheduled tracking data cleanup...');
        const stats = activityTracker.cleanupStaleData();
        console.log('[System] Tracking cleanup stats:', stats);
    } catch (error) {
        console.error('Error during tracking cleanup:', error);
    }
}, 3600000); // Run every hour (3600000 ms)

// Add stats logging interval (every 30 minutes)
const statsLoggingInterval = setInterval(() => {
    try {
        const stats = activityTracker.getStats();
        console.log('[System] ActivityTracker stats:', stats);
    } catch (error) {
        console.error('Error logging stats:', error);
    }
}, 1800000); // Every 30 minutes (1800000 ms)

startBot();

// handlers and uncaught errors for shutdown
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await handleShutdown();
});
process.on('unhandledRejection', async (error) => {
    console.error('Unhandled Rejection:', error);
    await handleShutdown();
});