/**
 * Handles tracking and rewarding user activity in the bot
 * @module utils/activityTracker
 */
import { REWARDS } from './rewardConfig.js';

/**
 * Class that tracks user activity for message and voice rewards
 */
class ActivityTracker {
    /**
     * Create a new ActivityTracker instance
     * Sets up tracking maps for messages and voice activity
     */
    constructor() {
        // track message cooldowns: userId_guildID -> timestamp
        this.messageCooldowns = new Map();

        // track hourly message counts: userId_guildID -> [timestamps]
        this.messageHourlyTracker = new Map();

        // track voice activity: userId_guildID -> {joinTime, pointsEarned}
        this.voiceActivity = new Map();
    }

    /**
     * Checks if a user can earn points for sending a message
     * Enforces cooldown periods and hourly limits
     * 
     * @param {string} userId - The Discord user ID
     * @param {string} guildId - The Discord guild ID
     * @returns {boolean} True if user can earn points, false otherwise
     */
    canEarnMessagePoints(userId, guildId) {
        const key = `${userId}_${guildId}`;
        const now = Date.now();

        // check cooldown
        const lastMessageTime = this.messageCooldowns.get(key) || 0;
        // if last message was too recent, return false
        if (now - lastMessageTime < REWARDS.MESSAGE.COOLDOWN_MS) {
            return false;
        }

        // check hourly limit
        let hourlyMessages = this.messageHourlyTracker.entries(key) || [];
        hourlyMessages = hourlyMessages.filter(time => now - time < 3600000); // last hour

        if (hourlyMessages.length >= REWARDS.MESSAGE.MAX_PER_HOUR) {
            return false;
        }

        // update trackers
        // set cooldown
        this.messageCooldowns.set(key, now);
        // add to hourly along with other messages in the last hour
        this.messageHourlyTracker.set(key, [...hourlyMessages, now]);
        return true;
    }

    /**
     * Determines if a message is valid for earning points
     * Checks message length and content criteria
     * 
     * @param {string} content - The message content to check
     * @returns {boolean} True if message is valid, false otherwise
     */
    isValidMessage(content) {
        // check message length and content
        if (content.length < REWARDS.MESSAGE.MIN_LENGTH) return false;

        // could add more checks here later if needed

        return true;
    }

    /**
     * Starts tracking a user's voice channel session
     * Called when a user joins a voice channel
     * 
     * @param {string} userId - The Discord user ID
     * @param {string} guildId - The Discord guild ID
     * @param {number} channelUserCount - Number of users in the voice channel
     */
    startVoiceSession(userId, guildId, channelUserCount) {
        const key = `${userId}_${guildId}`;
        this.voiceActivity.set(key, {
            joinTime: Date.now(),
            pointsEarned: 0
        });
        
        console.log(`[Voice] ${userId} started session in ${guildId}`);
    }

    /**
     * Updates voice activity tracking and calculates points earned
     * Called periodically for users in voice channels
     * 
     * @param {string} userId - The Discord user ID
     * @param {string} guildId - The Discord guild ID
     * @param {number} channelUserCount - Number of users in the voice channel
     * @returns {number} Points earned during this update
     */
    updateVoiceActivity(userId, guildId, channelUserCount) {
        const key = `${userId}_${guildId}`;
        const activity = this.voiceActivity.get(key);

        if (!activity) return 0;
        if (channelUserCount < REWARDS.VOICE.MIN_USERS) return 0;

        const now = Date.now();
        const minutesSinceLastCheck = 1; // Since we're called every minute

        const newPoints = Math.floor(minutesSinceLastCheck * REWARDS.VOICE.POINTS_PER_MINUTE);
        activity.pointsEarned += newPoints;

        // Check hourly limit
        if (activity.pointsEarned > REWARDS.VOICE.MAX_POINTS_PER_HOUR) {
            const excess = activity.pointsEarned - REWARDS.VOICE.MAX_POINTS_PER_HOUR;
            activity.pointsEarned = REWARDS.VOICE.MAX_POINTS_PER_HOUR;
            return Math.max(newPoints - excess, 0);
        }

        return newPoints;
    }

    /**
     * Ends a user's voice session tracking
     * Called when a user leaves a voice channel
     * 
     * @param {string} userId - The Discord user ID
     * @param {string} guildId - The Discord guild ID
     */
    endVoiceSession(userId, guildId) {
        const key = `${userId}_${guildId}`;
        console.log(`[Voice] ${userId} ended session in ${guildId}`);
        this.voiceActivity.delete(key);
    }

    /**
     * Gets debug information about a user's current voice session
     * Used for troubleshooting and monitoring
     * 
     * @param {string} userId - The Discord user ID
     * @param {string} guildId - The Discord guild ID
     * @returns {Object|null} Session info object or null if no active session
     * @property {number} joinTime - Timestamp when the user joined
     * @property {number} pointsEarned - Total points earned in current session
     * @property {number} timeSinceLastSpoke - Milliseconds since user joined
     * @property {number} sessionDuration - Total session duration in milliseconds
     */
    getDebugInfo(userId, guildId) {
        const key = `${userId}_${guildId}`;
        const activity = this.voiceActivity.get(key);
        
        if (!activity) return null;

        return {
            ...activity,
            timeSinceLastSpoke: Date.now() - activity.joinTime,
            sessionDuration: Date.now() - activity.joinTime
        };
    }
}

/**
 * Singleton instance of the ActivityTracker
 * @type {ActivityTracker}
 */
export const activityTracker = new ActivityTracker();