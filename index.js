import { config, token } from '#utils/config'
import { Client, GatewayIntentBits, Partials, Collection, Events } from 'discord.js'
import fs from 'fs'
import path from 'path'


console.debug = (config.debug ? console.log : function() {})
console.log("Running in", (config.debug ? "DEBUG" : "PRODUCTION"), "mode")
if (!config.debug || config.reloadRequired) import('./deploy-commands.js')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildEmojisAndStickers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ],
});


/**
 *  Commands not for the public
 */
// try {
//     const { registerSecret } = await import("./commands/secret.js");
//     registerSecret(client);
// } catch(error) {
//     if (error.code === "ERR_MODULE_NOT_FOUND") {
//         console.log('Ignoring missing optional module')
//     } else {
//         throw error
//     }
// }

client.commands = new Collection();

const commandsPath = path.join(path.resolve(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const { commands } = await import(filePath);

    // Commands are a list of commands for each file
    for (const command of commands) {
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

/**
 *  Checking interaction and running registered command
 */
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
        const err = `No command matching "${interaction.commandName}" was found.`
		console.error(err);
        await interaction.reply({ content: err, ephemeral: true });
		return;
	}

	try {
        console.log(`Running command: '${command.data.name}'`);
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

/**
 *  OLD CODE TO BE SORTED
 */

// function logHeader(msg) {
//     return `[${msg.guild.name}][${msg.channel.name}]`
// }

// // Interaction setup
// client.on('interactionCreate', async interaction => {
// 	if (!interaction.isCommand()) return;
// 	const { commandName } = interaction;

// 	if (commandName === 'ping') {
// 		await interaction.reply('Pong!');
// 	} else if (commandName === 'server') {
// 		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
// 	} else if (commandName === 'user') {
// 		await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
//     }
// });

// // Module event setup
// client.on('ready', () => {
//     console.log(`Logged in as ${client.user.tag}!`);
//     if (!config.debug) {
//         const guilds = client.guilds.cache.map(guild => guild.id);
//         console.log("Registering guilds:", guilds);
//         registerCommands(guilds);
//     }
// });

// // All of these client events are just for logging
// client.on('messageCreate', async msg => {
//     if (msg.author.bot || await checkPartial(msg)) return
//     if (config.debug && msg.channel.name === 'bot-test') return
//     console.debug(`${logHeader(msg)} ${msg.author.username}: ${msg.content}`)
// });

// client.on('messageReactionAdd', async (reaction, user) => {
//     if (user.bot || await checkPartial(reaction)) return
//     if (config.debug && reaction.message.channel.name === 'bot-testing') return
//     console.debug(`${logHeader(reaction.message)} ${user.username} reacted to ${reaction.message.author.username} with ${reaction.emoji.name}`)
// });

try {
    client.login(token);
} catch(error) {
    console.error('The client crashed :(', error)
}
