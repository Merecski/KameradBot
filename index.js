import { config, token } from '#utils/config'
import { checkPartial } from '#utils/utils'
import { BasedCounter } from '#cmd/based'
import registerCommands from './deploy-commands.js'
import { Client, Intents } from 'discord.js'

if (!config.debug || config.reloadRequired) import('./deploy-commands.js')

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const based = new BasedCounter(client);

function logHeader(msg) {
    return `[${msg.guild.name}][${msg.channel.name}]`
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
	} else if (commandName === 'user') {
		await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
	}
});

client.on('messageCreate', async msg => {
    if (msg.author.bot || await checkPartial(msg)) return
    if (config.debug && msg.channel.name !== 'bot-testing') return
    console.debug(`${msg.author.username}: ${msg.content}`)
    // based.handleBasedMsgs(msg)
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot || await checkPartial(reaction)) return
    if (config.debug && reaction.message.channel.name !== 'bot-testing') return
    if (user.author === reaction.author) return
    console.debug(`${logHeader(reaction.message)} ${user.username} reacted to ${reaction.message.author.username} with ${reaction.emoji.name}`)
    // based.handleBasedReactions(reaction)
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    if (!config.debug) {
        const guilds = client.guilds.cache.map(guild => guild.id);
        console.log("Registering guilds:", guilds);
        registerCommands(guilds);
    }
});

client.login(token);
