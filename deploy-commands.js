import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { config, token } from '#utils/config'
import fs from 'fs/promises'
import path from 'path'

// Prevent the testing bot and produciton bot from overlapping
// TODO Maybe re-add this later?
const test = config.debug ? 'test_' : ''

/**
 * Dynamically loads in command modules. This allows for last minute modificaitons
 * or ignore list from config.
 * @param {String} guildIDs Array of strings pertaining to the guild's ID to register to
 */
export default async function registerCommands(guildIDs) {
    const absolutePath = path.resolve('./commands');
	console.log('Not loading modules:', config.ignoreModules)
	var cmds = []
	var files = await fs.readdir(absolutePath)
	files = files.filter(filename => {
		// Remove ignored modules
		const file = path.parse(filename)
		return file.ext === '.js' && !config.ignoreModules.includes(file.name)
	})
	for (const file of files) {
		// Add all .js modules with commands into main list
		const { commands } = await import(path.join(absolutePath, file))
		if (commands) cmds = cmds.concat(commands)
	}

	// Convert all commands to json to prep for registration
	cmds = cmds.map(command => command.toJSON())
	console.log("All avaliable commands:", cmds.map(c => c.name))

	const rest = new REST({ version: '9' }).setToken(token);

	for (const guildID of guildIDs) {
		(async () => {
			try {
				console.log(`Started refreshing application (/) commands for ${guildID}.`);
				await rest.put(
					Routes.applicationGuildCommands(config.clientID, guildID),
					{ body: cmds },
				);
				console.log(`Successfully reloaded application (/) commands for ${guildID}.`);
			} catch (error) {
				console.error(error);
				process.exit(1)
			}
		})();
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	// const guildIds = [ config.guildID ];
	// const guildIds = [ '313843359091392512' ]; // 4MX
	// const guildIds = ['940085880431988746'] // ABs
	const guildIds = ['809978075189739562'] // Western
	registerCommands(guildIds)
}