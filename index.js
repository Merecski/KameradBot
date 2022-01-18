require('dotenv').config();

const { Client, Intents } = require('discord.js');
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// client.on('interactionCreate', async interaction => {
//   if (!interaction.isCommand()) return;

//   if (interaction.commandName === 'ping') {
//     await interaction.reply('Pong!');
//   }
// });

client.on('messageCreate', msg => {
    if (msg.author.bot) return

    if (msg.content == "ping") {
        msg.channel.send("pong")
    }
  });

client.login(process.env.TOKEN);