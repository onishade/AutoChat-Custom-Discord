import fetch from 'node-fetch';
import readline from 'readline-sync';
import fs from 'fs';
import chalk from 'chalk';
import cfonts from 'cfonts';

cfonts.say('NT Exhaust', {
  font: 'block',
  align: 'center',
  colors: ['cyan', 'magenta'],
  background: 'black',
  letterSpacing: 1,
  lineHeight: 1,
  space: true,
  maxLength: '0',
});

console.log(chalk.green("=== Telegram Channel : NT Exhaust ( @NTExhaust ) ==="));

// Input dari user
const channelIds = readline.question("Masukkan ID channel (pisahkan dengan koma untuk banyak channel): ").split(',').map(id => id.trim());
const messageContent = readline.question("Masukkan pesan yang ingin dikirim: ");
const deleteOption = readline.question("Ingin menghapus pesan setelah dikirim? (yes/no): ").toLowerCase() === 'yes';
const waktuKirim = parseInt(readline.question("Set Waktu Delay Kirim Pesan (dalam detik): ")) * 1000;

let waktuHapus = 0;
let waktuSetelahHapus = 0;

if (deleteOption) {
    waktuHapus = parseInt(readline.question("Set Waktu Delay Hapus Pesan (dalam detik): ")) * 1000;
    waktuSetelahHapus = parseInt(readline.question("Set Waktu Delay Setelah Hapus Pesan (dalam detik): ")) * 1000;
}

const tokens = fs.readFileSync("token.txt", "utf-8").split('\n').map(token => token.trim());

// Fungsi kirim pesan
const sendMessage = async (channelId, content, token) => {
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            const messageData = await response.json();
            console.log(chalk.green(`[✔] Pesan terkirim ke ${channelId}: ${content}`));

            if (deleteOption) {
                await new Promise(resolve => setTimeout(resolve, waktuHapus));
                await deleteMessage(channelId, messageData.id, token);
            }

            return messageData.id;
        } else if (response.status === 429) {
            const retryAfter = (await response.json()).retry_after;
            console.log(chalk.red(`[!] Rate limit. Retry after ${retryAfter} detik.`));
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return sendMessage(channelId, content, token);
        } else {
            const err = await response.text();
            console.log(chalk.red(`[!] Gagal mengirim ke ${channelId}. Respon: ${err}`));
        }
    } catch (error) {
        console.error(chalk.red(`[!] Error mengirim pesan: ${error.message}`));
    }
    return null;
};

// Fungsi hapus pesan
const deleteMessage = async (channelId, messageId, token) => {
    try {
        const delResponse = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (delResponse.ok) {
            console.log(chalk.blue(`[✔] Pesan ${messageId} dihapus dari channel ${channelId}`));
        }
        await new Promise(resolve => setTimeout(resolve, waktuSetelahHapus));
    } catch (error) {
        console.error(chalk.red(`[!] Error menghapus pesan: ${error.message}`));
    }
};

// Main loop
(async () => {
    while (true) {
        for (const token of tokens) {
            for (const channelId of channelIds) {
                await sendMessage(channelId, messageContent, token);
                await new Promise(resolve => setTimeout(resolve, waktuKirim));
            }
        }
    }
})();
