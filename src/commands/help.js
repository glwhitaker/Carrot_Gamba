import { MessageTemplates } from '../utils/messageTemplates.js';
import { getCommand, getCommandsByCategory, getAllCommands } from './index.js';


export async function handleHelp(message, args) {
    try {
        // case 1: no args, show all commands by category
        if (args.length === 0) {
            return message.reply({
                embeds: [MessageTemplates.helpEmbed()]
            });
        }

        const query = args[0].toLowerCase();

        // case 2: help for specific category
        const categories = getCommandsByCategory();
        if (categories[query]) {
            return message.reply({
                embeds: [MessageTemplates.categoryHelpEmbed(query, categories[query])]
            });
        }

        // case 3: help for a specific command
        const command = getCommand(query);
        if (command) {
            return message.reply({
                embeds: [MessageTemplates.commandHelpEmbed(query, command)]
            });
        }

        // query not found
        return message.reply({
            embeds: [MessageTemplates.errorEmbed(`No command or category found for "${query}". Use \`${COMMAND_PREFIX}help\` to see all available commands and categories.`)]
        });

    } catch (error) {
        console.error('Error displaying help:', error);
        return message.reply({ 
            embeds: [MessageTemplates.errorEmbed('Sorry, there was an error displaying the help menu.')]
        });
    }
}