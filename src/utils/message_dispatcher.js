import config from '../config.js';

class ChannelQueue
{
    constructor(channelId)
    {
        this.channelId = channelId;
        this.queue = [];
        this.draining = false;
    }
}

class MessageDispatcher
{
    constructor()
    {
        this.channelQueues = new Map();
        this.PRIORITY = { HIGH: 0, NORMAL: 1 };
    }

    reply(message, options, priority = this.PRIORITY.NORMAL)
    {
        const channelId = message.channelId;
        return new Promise((resolve, reject) =>
        {
            this._enqueue(channelId, {
                priority,
                execute: () => message.reply(options),
                resolve,
                reject
            });
        });
    }

    edit(message, options, priority = this.PRIORITY.NORMAL)
    {
        const channelId = message.channelId;
        return new Promise((resolve, reject) =>
        {
            this._enqueue(channelId, {
                priority,
                execute: () => message.edit(options),
                resolve,
                reject
            });
        });
    }

    editReply(interaction, options, priority = this.PRIORITY.NORMAL)
    {
        const channelId = interaction.channelId;
        return new Promise((resolve, reject) =>
        {
            this._enqueue(channelId, {
                priority,
                execute: () => interaction.editReply(options),
                resolve,
                reject
            });
        });
    }

    send(channel, options, priority = this.PRIORITY.NORMAL)
    {
        const channelId = channel.id;
        return new Promise((resolve, reject) =>
        {
            this._enqueue(channelId, {
                priority,
                execute: () => channel.send(options),
                resolve,
                reject
            });
        });
    }

    delete(message, priority = this.PRIORITY.NORMAL)
    {
        const channelId = message.channelId;
        return new Promise((resolve, reject) =>
        {
            this._enqueue(channelId, {
                priority,
                execute: () => message.delete(),
                resolve,
                reject
            });
        });
    }

    _enqueue(channelId, entry)
    {
        let cq = this.channelQueues.get(channelId);
        if(!cq)
        {
            cq = new ChannelQueue(channelId);
            this.channelQueues.set(channelId, cq);
        }

        if(entry.priority === this.PRIORITY.HIGH)
        {
            const idx = cq.queue.findIndex(e => e.priority === this.PRIORITY.NORMAL);
            if(idx === -1)
                cq.queue.push(entry);
            else
                cq.queue.splice(idx, 0, entry);
        }
        else
        {
            cq.queue.push(entry);
        }

        this._ensureDraining(channelId);
    }

    async _ensureDraining(channelId)
    {
        const cq = this.channelQueues.get(channelId);
        if(cq.draining) return;
        cq.draining = true;

        while(cq.queue.length > 0)
        {
            const entry = cq.queue.shift();
            try
            {
                const result = await entry.execute();
                entry.resolve(result);
            }
            catch(err)
            {
                console.error(`[MessageDispatcher] Error in channel ${channelId}:`, err.message);
                entry.reject(err);
            }

            if(cq.queue.length > 0)
            {
                await new Promise(r => setTimeout(r, config.DISPATCHER.CHANNEL_SPACING_MS));
            }
        }

        cq.draining = false;
        this.channelQueues.delete(channelId);
    }
}

export const message_dispatcher = new MessageDispatcher();
