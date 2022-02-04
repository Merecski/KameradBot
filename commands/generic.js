import { SlashCommandBuilder } from '@discordjs/builders';

// Generic bot commands

var commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
	new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
]

function interactions(client) {
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
	})
}

export {
    commands,
	interactions,
}