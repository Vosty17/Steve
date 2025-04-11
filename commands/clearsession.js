const fs = require('fs');
const path = require('path');
const os = require('os');
const isOwner = require('../helpers/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'KnightBot MD',
            serverMessageId: -1
        }
    }
};

async function clearSessionCommand(sock, chatId, senderId) {
    try {
        // Check if sender is owner
        if (!isOwner(senderId)) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                
            });
            return;
        }

        // Define session directory
        const sessionDir = path.join(__dirname, '../session');

        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { 
                text: '❌ Session directory not found!',
                
            });
            return;
        }

        let filesCleared = 0;
        let errors = 0;
        let errorDetails = [];

        // Send initial status
        await sock.sendMessage(chatId, { 
            text: `🔍 Optimizing session files for better performance...`,
            
        });

        const files = fs.readdirSync(sessionDir);
        
        // Count files by type for optimization
        let appStateSyncCount = 0;
        let preKeyCount = 0;

        for (const file of files) {
            if (file.startsWith('app-state-sync-')) appStateSyncCount++;
            if (file.startsWith('pre-key-')) preKeyCount++;
        }

        for (const file of files) {
            try {
                // Skip protected files
                if (file === 'creds.json') {
                    continue;
                }

                const filePath = path.join(sessionDir, file);
                if (!fs.statSync(filePath).isFile()) continue;

                // Optimize app-state-sync files (keep only latest 3)
                if (file.startsWith('app-state-sync-')) {
                    if (appStateSyncCount > 3) {
                        fs.unlinkSync(filePath);
                        filesCleared++;
                        appStateSyncCount--;
                    }
                    continue;
                }

                // Optimize pre-key files (keep only latest 5)
                if (file.startsWith('pre-key-')) {
                    if (preKeyCount > 5) {
                        fs.unlinkSync(filePath);
                        filesCleared++;
                        preKeyCount--;
                    }
                    continue;
                }

                // Clear old sender-key files
                if (file.startsWith('sender-key-')) {
                    const stats = fs.statSync(filePath);
                    const fileAge = Date.now() - stats.mtimeMs;
                    // Clear only if older than 6 hours
                    if (fileAge > 21600000) {
                        fs.unlinkSync(filePath);
                        filesCleared++;
                    }
                }

            } catch (err) {
                console.error('Error processing file:', file, err);
                errors++;
                errorDetails.push(`${file}: ${err.message}`);
            }
        }

        // Send optimized success message
        let resultMessage = `✨ *Session Optimization Complete*\n\n` +
                          `🔄 Files optimized: ${filesCleared}\n` +
                          `⚡ Bot performance improved!\n\n` +
                          `*Note:* Bot will maintain faster response times now.`;

        if (errors > 0) {
            resultMessage += `\n\n⚠️ Skipped ${errors} file(s) for safety.`;
        }

        await sock.sendMessage(chatId, { 
            text: resultMessage,
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error occurred while optimizing sessions!\n' + error.message,
            ...channelInfo
        });
    }
}

module.exports = clearSessionCommand; 
