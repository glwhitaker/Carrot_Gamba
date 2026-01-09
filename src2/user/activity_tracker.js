import config from '../config.js';
import { db_manager } from '../db/db_manager.js';
import { ChannelType } from 'discord.js';

// This class tracks user activity for message and voice rewards
class ActivityTracker
{
    constructor()
    {
        this.activeVoiceUsers = new Map();
    }

    init(client)
    {
        // listener for messages for points
        client.on('messageCreate', async (message) =>
        {
            if(message.author.bot) return;

            if(message.content.startsWith(config.COMMAND_PREFIX)) return;

            // parse user and guild id
            const user_id = message.author.id;
            const guild_id = message.guild.id;

            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                // track message activity
                if(activity_tracker.isValidMessage(message.content) && activity_tracker.canEarnMessagePoints(user))
                {
                    const carrots = config.MESSAGE.POINTS * user.progression.passive_multiplier;
                    await db_manager.updateUserBalance(user_id, guild_id, carrots);
                }
            }
        });

        // listener for voice state updates
        client.on('voiceStateUpdate', async (old_state, new_state) =>
        {
            const user_id = new_state.id;
            const guild_id = new_state.guild.id;
            const key = `${guild_id}-${user_id}`;

            // check if user is enrolled
            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                // left voice entirely
                if(old_state.channelId && !new_state.channelId)
                {
                    if(this.activeVoiceUsers.has(key))
                    {
                        this.activeVoiceUsers.delete(key);
                        console.log(`[ActivityTracker] Ended voice session for: ${new_state.member.user.tag}`);
                    }
                }
                // joined voice channel
                else if(!old_state.channelId && new_state.channelId)
                {
                    if(!new_state.mute && !new_state.deaf && new_state.member?.presence?.status !== 'offline')
                    {
                        this.activeVoiceUsers.set(key, new_state.channelId);
                        console.log(`[ActivityTracker] Started voice session for: ${new_state.member.user.tag}`);
                    }
                }
                // state changed within voice
                else if(new_state.mute || new_state.deaf || new_state.member?.presence?.status === 'offline')
                {
                    if(this.activeVoiceUsers.has(key))
                    {
                        this.activeVoiceUsers.delete(key);
                        console.log(`[ActivityTracker] Ended voice session for: ${new_state.member.user.tag}`);
                    }
                }
                else
                {
                    this.activeVoiceUsers.set(key, new_state.channelId);
                    console.log(`[ActivityTracker] Started voice session for: ${new_state.member.user.tag}`);
                }
            }
        });

        this.startVoiceForActiveUsers(client);

        // interval to reward voice activity
        setInterval(() => {this.awardVoicePoints();}, config.VOICE.REWARD_INTERVAL_MS);
    }

    async startVoiceForActiveUsers(client)
    {
        // check guilds for active voice channels and start a voice session
        client.guilds.cache.forEach(guild =>
        {
            guild.channels.cache.forEach(channel =>
            {
                // is voice channel and currently has members
                if(channel.type === ChannelType.GuildVoice && channel.members.size > 0)
                {
                    console.log(`[ActivityTracker] Active voice channel found in guild ${guild.name}: ${channel.name}`);

                    channel.members.forEach(async member =>
                    {
                        const user_id = member.id;
                        const guild_id = guild.id;
                        const key = `${guild_id}-${user_id}`;

                        const user = await db_manager.getUser(user_id, guild_id);
                        if(user)
                        {
                            if(!member.voice.mute && !member.voice.deaf && member.presence?.status !== 'offline')
                            {
                                this.activeVoiceUsers.set(key, channel.id);
                                console.log(`[ActivityTracker] Started voice session for: ${member.user.tag}`);
                            }
                        }
                    });
                }
            });
        });
    }

    isValidMessage(content)
    {
        if(content.length < config.MESSAGE.MIN_LENGTH)
            return false;
        
        return true;
    }

    canEarnMessagePoints(user)
    {
        const now = new Date();
        const last_message = new Date(user.last_message_date);
        const time_diff = now - last_message;

        if(time_diff < config.MESSAGE.COOLDOWN_MS)
            return false;

        db_manager.updateLastMessageDate(user, now.toISOString());

        return true;
    }

    async awardVoicePoints()
    {
        this.activeVoiceUsers.forEach(async (channel_id, key) =>
        {
            const [guild_id, user_id] = key.split('-');

            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                const carrots = config.VOICE.POINTS * user.progression.passive_multiplier;
                await db_manager.updateUserBalance(user_id, guild_id, carrots);
            }
        });
    }
}

export const activity_tracker = new ActivityTracker();