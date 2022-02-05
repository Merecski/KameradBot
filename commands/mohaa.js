import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource
} from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders';

import fs from 'fs/promises';
import path from 'path';

const german = './sound/mohaa/g';
const american = './sound/mohaa/a';

function registerMohaa(client) {
    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) return;
            const { commandName } = interaction;
            const guild = client.guilds.cache.get(interaction.guildId); // Getting the guild.
            const member = guild.members.cache.get(interaction.user.id); // Getting the member.
            const voiceChannel = member.voice.channel
            if (!voiceChannel) {
                    console.log(`${member.user.tag} is not connected.`);
                    return
            }
            if (commandName == 'mohaa') {
                if (interaction.options.getSubcommand() === 'american') {
                    console.log('Playing American audio')
                    playRandomAmericanMohaa(voiceChannel).then( name => {
                        interaction.reply({content: `Playing: ${name}`, ephemeral: true})
                    })
                } else if (interaction.options.getSubcommand() === 'german') {
                    console.log('Playing German audio')
                    playRandomGermanMohaa(voiceChannel).then( name => {
                        interaction.reply({content: `Playing: ${name}`, ephemeral: true})
                    })
                } else {
                    console.log('Playing Random audio')
                    playRandomMohaa(voiceChannel).then( name => {
                        interaction.reply({content: `Playing: ${name}`, ephemeral: true})
                    })
                }
            }
        })
}

function connect(channel, file) {
    return new Promise((resolve, reject) => {
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            const player = createAudioPlayer();
            console.log(`Playing file ${file}`)
            const resource = createAudioResource(file);
            player.play(resource);
            connection.subscribe(player)
            player.on('stateChange', (oldState, newState) => {
                console.log(`AudioPlayer transitioned from ${oldState.status} to ${newState.status}`);
                if (newState.status === 'idle') {
                    player.stop()
                    connection.destroy()
                }
            });
            resolve()
        } catch (error) {
            reject(error)
        }
    })

}

async function americanFiles() {
    const files = await fs.readdir(american)
    files.forEach((file, index, arr) => { arr[index] = path.join(american, file) });
    return files
}

async function germanFiles() {
    const files = await fs.readdir(german)
    files.forEach((file, index, arr) => { arr[index] = path.join(german, file) });
    return files
}

function randomFile(files) {
    return files[Math.floor(Math.random() * files.length)]
}

async function playRandomGermanMohaa(channel) {
    const files  = await germanFiles()
    const file = randomFile(files)
    connect(channel, file)
    return path.basename(file);
}

async function playRandomAmericanMohaa(channel) {
    const files = await americanFiles()
    const file = randomFile(files)
    connect(channel, file)
    return path.basename(file);
}

async function playRandomMohaa(channel) {
    return americanFiles().then( afiles => {
        return germanFiles().then( gfiles => {
            const files = afiles.concat(gfiles);
            const file = randomFile(files)
            connect(channel, file)
            return path.basename(file);
        })
    })
}

const commands = [
    new SlashCommandBuilder()
        .setName('mohaa')
        .setDescription('Plays random audio file from MOHAA')
        .addSubcommand(subcommand => subcommand.setName('german').setDescription('german'))
        .addSubcommand(subcommand => subcommand.setName('american').setDescription('american'))
        .addSubcommand(subcommand => subcommand.setName('random').setDescription('random'))
]

export {
    commands,
    registerMohaa
}