import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleDefault(message)
{
    return message.reply({
        embeds: [MessageTemplates.errorMessage('Invalid command. Use \`^help\` to see available commands.')]
    });
}