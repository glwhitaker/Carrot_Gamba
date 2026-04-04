import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';
import { message_dispatcher } from '../utils/message_dispatcher.js';

export async function handleDefault(message, m)
{
    return message_dispatcher.reply(message, {
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.errorMessage(m)]
    }, message_dispatcher.PRIORITY.HIGH);
}