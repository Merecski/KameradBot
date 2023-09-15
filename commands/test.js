import { SlashCommandBuilder } from 'discord.js';

function register(client) {
    // client.on('interactionCreate', interaction => {
    //     if (!interaction.isCommand()) return;
    //     const { commandName } = interaction;
    //     const guild = client.guilds.cache.get(interaction.guildId); // Getting the guild.
    //     const member = guild.members.cache.get(interaction.user.id); // Getting the member.
    //     const voiceChannel = member.voice.channel
    // })\
}


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