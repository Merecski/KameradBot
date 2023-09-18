import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config, token } from '#utils/config'

import fs from 'fs'
import path from 'path'

// Prevent the testing bot and produciton bot from overlapping
// TODO Maybe re-add this later?
const test = config.debug ? 'test_' : ''

/**
 * Dynamically loads in command modules. This allows for last minute modificaitons
 * or ignore list from config.
 * @param {String} guildIds Array of strings pertaining to the guild's ID to register to
 */
export default async function registerCommands(guildIds) {
	console.log("Registering in debug?", config.debug)
	console.log('Not loading modules:', config.ignoreModules)
	let registerCommands = [];
	
	const foldersPath = path.join(path.resolve(), 'commands');
	const commandFolders = fs.readdirSync(foldersPath).filter(folder => !config.ignoreModules.includes(folder))
	console.log('Checking subfolders for commands:', commandFolders)
	
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
					registerCommands.push(command.data.toJSON());
				} else {
					console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
				}
			}
		}
	}

	console.log("All avaliable commands:", registerCommands.map(c => c.name))

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(token);

	for (const guildId of guildIds) {
		// and deploy your commands!
		(async () => {
			try {
				console.log(`Started refreshing ${registerCommands.length} application (/) commands for ${guildId}`);
	
				// The put method is used to fully refresh all commands in the guild with the current set
				const data = await rest.put(
					Routes.applicationGuildCommands(config.clientID, guildId),
					{ body: registerCommands },
				);
	
				console.log(`Successfully reloaded ${data.length} application (/) command  for ${guildId}`);
			} catch (error) {
				// And of course, make sure you catch and log any errors!
				console.error(error);
			}
		})();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	registerCommands([process.env.GUILD_BOT_TESTING])
}