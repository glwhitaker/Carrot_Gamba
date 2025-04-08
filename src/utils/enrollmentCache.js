class EnrollmentCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 5 * 60 * 1000; // 5 minutes
    }

    getKey(userId, guildId) {
        return `${userId}_${guildId}`;
    }

    set(userId, guildId, enrolled) {
        const key = this.getKey(userId, guildId);
        this.cache.set(key, {
            enrolled,
            timestamp: Date.now()
        })
    }

    get(userId, guildId) {
        const key = this.getKey(userId, guildId);
        const data = this.cache.get(key);

        if(!data) return null;

        // clear expired entires

        if (Date.now() - data.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        return data.enrolled;
    }
    
}

export const enrollmentCache = new EnrollmentCache();