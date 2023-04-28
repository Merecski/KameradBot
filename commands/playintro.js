import { SlashCommandBuilder } from '@discordjs/builders'
import { Interaction } from 'discord.js'
import { connect } from './voice.js'
import { readdirSync } from 'fs'
import { getUserIntro, updateUserIntro } from './playintro.fetch.js'
import { config } from '#utils/config'

/**
 * This is not important enough to be local. Stores the last date someone recieved their intro.
 * Currently this is preped to make sure intros are only ran once a day
 * Format {username: id}
 */
var lastPlayed = {}

const introFileLocation = config.soundFiles + "/intros/"
var introFiles = readdirSync(introFileLocation);

var user_intros = {}

class UserIntros {
    constructor(intro_enable, intro_file) {
        this.intro_enable = intro_enable
        this.intro_file = intro_file
    }
}

function registerIntros(client) {
    //Load from database
    loadIntroData()

    client.on('voiceStateUpdate', (oldState, newState) => { 
        if (oldState.channelId === null && newState.channelId !== null) {
            console.log(`VoiceStateUpdate ${newState.member.displayName} has joined ${newState.guild.name}`)
            checkRunIntros(newState.member.id, newState.channel)
        }
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) return;
        const { commandName } = interaction;
        if (commandName !== 'intro') return;

        const subcmd = interaction.options.getSubcommand();
        console.log(subcmd, introFunctions)
        if (subcmd in introFunctions) {
            const action = introFunctions[subcmd];
            action(interaction);
        } else {
            console.log("Invalid Intro command")
        }
    })
}

function loadIntroData() {
    getUserIntro()
    .then( (data) => {
        if (!data) {
            console.log("FAILED to load based data. Response:", data)
            return
        }
        data.forEach(({userid, intro_enable, intro_file}) => {
            user_intros[userid] = new UserIntros(intro_enable, intro_file)
        })
    })
}

var introFunctions = {
    "add": addIntro,
    "remove": removeIntro,
    "enable": enableIntro,
    "disable": disableIntro
}

/**
 * 
 * @param {Interaction} interaction 
 * @returns 
 */
function addIntro(interaction) {
    var filename = interaction.options.getString('filename')
    var targetUser = interaction.options.getString('user')
    if (!introFiles.includes(filename)) {
        interaction.reply({content: `Intro file not found.`, ephemeral: true});
        return;
    }
    if (!targetUser) targetUser = interaction.user.id
    console.log(`Adding ${filename} as ${targetUser} intro`)
    updateUserIntro(targetUser, true, filename)
    .then(() => {
        user_intros[targetUser].intro_file = filename
        interaction.reply({content: `Added intro file`, ephemeral: true});
    })
}

/**
 * 
 * @param {Interaction} interaction 
 * @returns 
 */
function removeIntro(interaction) {
    updateUserIntro(interaction.user.id, false, "")
    .then(() => {
        user_intros[interaction.user.id].intro_file = ""
        interaction.reply({content: `Removed intro filename.`, ephemeral: true});
    })
}

/**
 * 
 * @param {Interaction} interaction 
 * @returns 
 */
function enableIntro(interaction) {
    console.log("command enable start")

    updateUserIntro(interaction.user.id, true, user_intros[interaction.user.id].intro_file)
    .then((text) => {
        console.log("text", text)
        user_intros[interaction.user.id].intro_enable = true
        interaction.reply({content: `Enabled intro.`, ephemeral: true});
    })
}

/**
 * 
 * @param {Interaction} interaction 
 * @returns 
 */
function disableIntro(interaction) {
    updateUserIntro(interaction.user.id, false, user_intros[interaction.user.id].intro_file)
    .then(() => {
        user_intros[interaction.user.id].intro_enable = false
        interaction.reply({content: `Disabled intro.`, ephemeral: true});
    })
}

function checkRunIntros(joinId, channel) {
    for (const [id, introData] of Object.entries(user_intros)) {
        if (!introData.intro_enable) continue
        const d = new Date();

        // Only run once a day
        if (joinId === id) {
            if (d.getDate() === lastPlayed[id]) return

            console.debug(`Activating ${id} intro`)
            lastPlayed[id] = d.getDate()
            connect(channel, introFileLocation + introData.intro_file)
            return
        }
    }
}

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('Enable or disable personal intro')
        .addSubcommand(subcommand => subcommand.setName("enable").setDescription('Enable intro for user'))
        .addSubcommand(subcommand => subcommand.setName("disable").setDescription('Disable intro for user'))
        .addSubcommand(subcommand => subcommand.setName("add").setDescription('Add intro for user')
            .addStringOption(option => option.setName('filename').setDescription('filename of .mp3'))
            .addStringOption(option => option.setName('user').setDescription('Target user of intro. Leave blank for yourself')))
        .addSubcommand(subcommand => subcommand.setName("remove").setDescription('Remove intro for user')
            .addUserOption(option => option.setName('user').setDescription('Remove user\'s intro')))

]

export {
    registerIntros,
    commands
}
