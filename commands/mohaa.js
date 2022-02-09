import { connect } from '../voice/voice.js'
import { SlashCommandBuilder } from '@discordjs/builders';

import fs from 'fs/promises';
import path from 'path';

const germanDir = './sound/mohaa/g';
const americanDir = './sound/mohaa/a';
var germanAudio = {}
var americanAudio = {}

const subAudioCommands = [
    'individual_commands',
    'radio/announcement',
    'radio/ending',
    'squad_commands',
    'statements_responses',
    'taunts',
    'team_taunts'
]

function mohaafile(file, name) {
    this.file = file
    this.name = name
}

/**
 * This should only be ran once during initial startup to populate the
 * audio objects to point to valid files without re-searching
 */
async function populateAudio() {
    for (const type of subAudioCommands) {
        var afiles = await fs.readdir(path.join(americanDir, type));
        var gfiles = await fs.readdir(path.join(germanDir, type));
        afiles.forEach((file, index, arr) => { arr[index] = path.join(americanDir, type, file) });
        gfiles.forEach((file, index, arr) => { arr[index] = path.join(germanDir, type, file) });
        americanAudio[type] = afiles;
        germanAudio[type] = gfiles;
    }
}

function registerMohaa(client) {
    populateAudio() // If we are using the commands then populate the audio object
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

function randomFile(files) {
    return files[Math.floor(Math.random() * files.length)]
}

var randomProperty = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

function selectRandomFile(subcommand) {
    return randomFile(germanAudio[subcommand])
}

async function playRandomGermanMohaa(channel) {
    const subcmd = subAudioCommands[Math.floor(Math.random() * subAudioCommands.length)]
    const file = randomFile(germanAudio[subcmd])
    connect(channel, file)
    return path.basename(file);
}

async function playRandomAmericanMohaa(channel) {
    const subcmd = subAudioCommands[Math.floor(Math.random() * subAudioCommands.length)]
    const file = randomFile(americanAudio[subcmd])
    connect(channel, file)
    return path.basename(file);
}

async function playRandomMohaa(channel) {
    return americanFiles().then( afiles => {
        return germanFiles().then( gfiles => {
            if (files.length === 0) return '';
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
    populateAudio,
    registerMohaa
}