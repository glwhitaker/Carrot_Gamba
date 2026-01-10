import { db_manager } from '../db/db_manager.js';
import { MessageTemplates } from '../utils/message_templates.js';
import { MessageFlags } from 'discord.js';

export async function handleHelp(args, message, usage)
{
    return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [MessageTemplates.helpMessage()]
    });
}