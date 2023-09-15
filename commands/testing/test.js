import { SlashCommandBuilder } from 'discord.js';

async function execute(interaction) {
    await interaction.reply('Pong!');
}

const commands = [{
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    execute
}]

export {
    commands,
}