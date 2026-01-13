import config from '../config.js';
import { db_manager } from '../db/db_manager.js';
import { ChannelType } from 'discord.js';

// This class tracks user activity for message and voice rewards
class ActivityTracker
{
    constructor()
    {
        if(!ActivityTracker.instance)
        {
            ActivityTracker.instance = this;
        }
        this.activeVoiceUsers = new Map();
        this.client = null;
    }

    getInstance()
    {
        return ActivityTracker.instance;
    }

    init(client)
    {
        this.client = client;
        // listener for messages for points
        this.client.on('messageCreate', async (message) =>
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
                if(this.isValidMessage(message.content) && this.canEarnMessagePoints(user))
                {
                    const carrots = Math.floor(parseInt(config.MESSAGE.POINTS) * (1 + parseInt(user.progression.passive_multiplier) / 100));
                    await db_manager.updateUserBalance(user_id, guild_id, carrots);
                }
            }
        });

        // listener for voice state updates
        this.client.on('voiceStateUpdate', async (old_state, new_state) =>
        {
            const user_id = new_state.id;
            const guild_id = new_state.guild.id;

            // check if user is enrolled
            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                // left voice entirely
                if(old_state.channelId && !new_state.channelId)
                    this.endVoiceForUser(user);
                // joined voice channel
                else if(!old_state.channelId && new_state.channelId)
                {
                    if(!new_state.mute && !new_state.deaf && new_state.member?.presence?.status !== 'offline')
                        this.startVoiceForUser(user);
                }
                // state changed within voice
                else if(new_state.mute || new_state.deaf || new_state.member?.presence?.status === 'offline')
                    this.endVoiceForUser(user);
                else
                    this.startVoiceForUser(user);
            }
        });

        this.startVoiceForActiveUsers();

        // interval to reward voice activity
        setInterval(() => {this.awardVoicePoints();}, config.VOICE.REWARD_INTERVAL_MS);
    }

    async startVoiceForActiveUsers()
    {
        // check guilds for active voice channels and start a voice session
        this.client.guilds.cache.forEach(guild =>
        {
            guild.channels.cache.forEach(channel =>
            {
                // is voice channel and currently has members
                if(channel.type === ChannelType.GuildVoice && channel.members.size > 0)
                {
                    channel.members.forEach(async member =>
                    {
                        const user_id = member.id;
                        const guild_id = guild.id;

                        const user = await db_manager.getUser(user_id, guild_id);
                        if(user)
                        {
                            if(!member.voice.mute && !member.voice.deaf && member.presence?.status !== 'offline')
                                this.startVoiceForUser(user);
                        }
                    });
                }
            });
        });
    }

    startVoiceForUser(user)
    {
        const key = `${user.guild_id}-${user.user_id}`;
        if(!this.activeVoiceUsers.has(key))
        {
            this.activeVoiceUsers.set(key, true);
            console.log(`[ActivityTracker] Started voice session for: ${user.username}`);
        }
    }

    endVoiceForUser(user)
    {
        const key = `${user.guild_id}-${user.user_id}`;
        if(this.activeVoiceUsers.has(key))
        {
            this.activeVoiceUsers.delete(key);
            console.log(`[ActivityTracker] Ended voice session for: ${user.username}`);
        }
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
        this.activeVoiceUsers.forEach(async (status, key) =>
        {
            const [guild_id, user_id] = key.split('-');

            const user = await db_manager.getUser(user_id, guild_id);
            if(user)
            {
                const carrots = Math.floor(parseInt(config.VOICE.POINTS) * (1 + parseInt(user.progression.passive_multiplier) / 100));
                await db_manager.updateUserBalance(user_id, guild_id, carrots);
            }
        });
    }
}

export const activity_tracker = new ActivityTracker();