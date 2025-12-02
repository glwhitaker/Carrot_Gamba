import { MessageTemplates } from '../utils/messageTemplates.js';
import { MessageFlags } from 'discord.js';

export async function handleDefault(message, m)
{
    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage(m)]
    });
}