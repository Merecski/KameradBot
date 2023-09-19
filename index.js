import { config, token } from '#utils/config'
import { Client, GatewayIntentBits, Partials, Collection, Events } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { PlayerResource } from "#utils/player.resource"


console.debug = (config.debug ? console.log : function() {})
console.log("Running in", (config.debug ? "DEBUG" : "PRODUCTION"), "mode")
if (!config.debug || config.reloadRequired) import('./deploy-commands.js')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
    ],
});

/**
 * Create a single player resource manager to the 
 * client to be accessed globally
 */
client.player = new PlayerResource()


/**
 *  Commands not for the public
 */
try {
    client.secretCommands = new Collection();
    const commandsPath = path.join(path.resolve(), 'commands/secret');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const { commands } = await import(filePath);
    
        // Commands are a list of commands for each file
        for (const command of commands) {
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                client.secretCommands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
    console.log(`Registered secret commands:"`)
    console.log(client.secretCommands.map(cmd => cmd.data.name))
} catch(error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
        console.log('Ignoring missing optional module')
    } else {
        throw error
    }
}

client.commands = new Collection();
const foldersPath = path.join(path.resolve(), 'commands');
const commandFolders = fs.readdirSync(foldersPath).filter(folder => path.basename(folder) !== "secret")

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
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
}

console.log(`Registered commands:"`)
console.log(client.commands.map(cmd => cmd.data.name))

function logHeader(msg) {
    return `[${msg.guild.name}][${msg.channel.name}]`
}

function fLog(msg, output) {
    console.log(logHeader(msg), output)
}

client.once(Events.ClientReady, c => {
    const guilds = client.guilds.cache.map(guild => guild.id);
    console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log("Accessing these guilds:", client.guilds.cache.map(guild => guild.name));
    if (!config.debug) {
        console.log("Registering commands to guild");
        registerCommands(guilds);
    }
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
        console.log(`BOT-Executing: '${command.data.name}'`)
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (!(interaction.replied || interaction.deferred)) {
			await interaction.followUp({ content: 'There was an error that I am aware about', ephemeral: true });
		} else {
			await interaction.reply({ content: `There was an unexpected error!\nGo bug Mike about the issue:\n${error}`, ephemeral: true });
		}
	}
});

// All of these client events are just for logging
client.on('messageCreate', async msg => {
    if (msg.author.bot) return
    // if (config.debug && msg.channel.name === 'bot-test') return
    console.debug(`${logHeader(msg)} ${msg.author.username}: ${msg}`)
    if (msg.content.startsWith('\\')) {
        const command = msg.client.secretCommands.get(msg.content.slice(1));
        if (!command) {
            await msg.reply(`${msg.content.slice(1)}?`);
            return;
        }
        console.log(`Running secret command: '${command.data.name}'`);
		await command.execute(msg);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return
    if (config.debug && reaction.message.channel.name === 'bot-testing') return
    console.debug(`${logHeader(reaction.message)} ${user.username} reacted to ${reaction.message.author.username} with ${reaction.emoji.name}`)
});

try {
    client.login(token);
} catch(error) {
    console.error('The client crashed :(', error)
}
