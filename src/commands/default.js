import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleDefault(message) {
    return message.reply({ 
        embeds: [MessageTemplates.errorEmbed('Invalid command. Use ^help to see available commands.')]
    });
}