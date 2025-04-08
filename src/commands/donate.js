import { isUserEnrolled, updateUserBalance } from '../database/db.js';
import { MessageTemplates } from '../utils/messageTemplates.js';

export async function handleDonate(message, args) {
    try {
        if (args.length !== 2) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('Usage: `^donate <@user> <amount>`')]
            });
        }

        // Parse user mention and amount
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        // Validate target user
        if (!targetUser) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('Please mention a user to donate to!')]
            });
        }

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('Please specify a valid positive amount!')]
            });
        }

        // Can't donate to yourself
        if (targetUser.id === message.author.id) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('You cannot donate to yourself!')]
            });
        }

        // Check if both users are enrolled
        const [senderEnrolled, receiverEnrolled] = await Promise.all([
            isUserEnrolled(message.author.id, message.guild.id),
            isUserEnrolled(targetUser.id, message.guild.id)
        ]);

        if (!senderEnrolled) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('You need to `^enroll` first!')]
            });
        }

        if (!receiverEnrolled) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('That user needs to `^enroll` first!')]
            });
        }

        // Perform the donation using updateUserBalance
        const senderResult = await updateUserBalance(
            message.author.id,
            message.guild.id,
            -amount,
            `Donation to ${targetUser.username}`
        );

        if (!senderResult.success) {
            return message.reply({
                embeds: [MessageTemplates.errorEmbed(
                    senderResult.error === 'Insufficient balance' 
                        ? `You don't have enough carrots! You have ${senderResult.newBalance} 🥕`
                        : 'There was an error processing your donation.'
                )]
            });
        }

        // If sender's deduction succeeded, add to receiver
        const receiverResult = await updateUserBalance(
            targetUser.id,
            message.guild.id,
            amount,
            `Donation from ${message.author.username}`
        );

        if (!receiverResult.success) {
            // This should never happen since we're adding points
            console.error('Unexpected error adding points to receiver:', receiverResult.error);
            return message.reply({
                embeds: [MessageTemplates.errorEmbed('There was an error processing your donation.')]
            });
        }

        // Send success message
        return message.reply({
            embeds: [MessageTemplates.successEmbed(
                '🎁 Donation Successful!',
                `You donated ${amount} 🥕 to ${targetUser.username}!`
            )]
        });

    } catch (error) {
        console.error('Error in donate command:', error);
        return message.reply({
            embeds: [MessageTemplates.errorEmbed('There was an error processing your donation.')]
        });
    }
}
