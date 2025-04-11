const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../config/messageConfig');

async function unbanCommand(sock, chatId, message) {
    let userToUnban;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToUnban) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user or reply to their message to unban!', 
            
        });
        return;
    }

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./database/banned.json'));
        const index = bannedUsers.indexOf(userToUnban);
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync('./database/banned.json', JSON.stringify(bannedUsers, null, 2));
            
            await sock.sendMessage(chatId, { 
                text: `Successfully unbanned ${userToUnban.split('@')[0]}!`,
                mentions: [userToUnban],
                
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: `${userToUnban.split('@')[0]} is not banned!`,
                mentions: [userToUnban],
                
            });
        }
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to unban user!', });
    }
}

module.exports = unbanCommand; 
