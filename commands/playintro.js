import { SlashCommandBuilder } from '@discordjs/builders'
import { connect } from './voice.js'
import { pool } from '../database/database.js'

/**
 * This is not important enough to be local. Stores the last date someone recieved their intro.
 * Currently this is preped to make sure intros are only ran once a day
 * Format {username: id}
 */
var lastPlayed = {
}

var reserved = {
    '204761315808509952': './sound/intros/john-cena.mp3',
    '159782355723223042': './sound/intros/hank-hill-rap.mp3',
    '224270656643137536': './sound/intros/brain_fart.mp3'
}


function registerIntros(client) {
    client.on('voiceStateUpdate', (oldState, newState) => { 
        if (oldState.channelId === null && newState.channelId !== null) {
            console.log(`VoiceStateUpdate ${newState.member.displayName} has joined ${newState.guild.name}`)
            checkRunIntros(newState.member.id, newState.channel)
        }
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) return;
        const { commandName } = interaction;
        if (commandName === 'intro') {
            const subcmd = interaction.options.getSubcommand();
            if (subcmd === 'enable') {
                pool.query(`UPDATE users SET intro_enable = 1 WHERE userid = '${id}'`, (err) => {
                    if (err) console.log(err)
                })
                interaction.reply({content: `Set intro to enabled`, ephemeral: true})
            } else if (subcmd === 'disable') {
                pool.query(`UPDATE users SET intro_enable = 0 WHERE userid = '${id}'`, (err) => {
                    if (err) console.log(err)
                })
                interaction.reply({content: `Set intro to disabled`, ephemeral: true})
            } else if (subcmd === 'add') {
                subcmd.options.getString('filename')
                pool.query(`UPDATE users SET intro_file = ${filename} WHERE userid = '${id}'`, (err) => {
                    if (err) console.log(err)
                })
                interaction.reply({content: `Set intro to disabled`, ephemeral: true})
            } else if (subcmd === 'remove') {
                subcmd.options.getString('filename')
                pool.query(`UPDATE users SET intro_file = ${filename} WHERE userid = '${id}'`, (err) => {
                    if (err) console.log(err)
                })
                interaction.reply({content: `Set intro to disabled`, ephemeral: true})
            }
        } 
    })
}

function checkRunIntros(joinId, channel) {
    for (const [id, file] of Object.entries(reserved)) {
        const d = new Date();
        // Only run once a day
        if (joinId === id) {
            if (d.getDate() === lastPlayed[id]) {
                console.log(`${id} already had their intro today`)
                continue
            }
            console.log(`Activating ${id} intro`)
            lastPlayed[id] = d.getDate()
            connect(channel, file)
        }
    }
}

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('Enable or disable personal intro')
        .addSubcommand(subcommand => subcommand.setName('enable').setDescription('Enable intro for user'))
        .addSubcommand(subcommand => subcommand.setName('disable').setDescription('Disable intro for user'))
        .addSubcommand(subcommand => subcommand.setName('add').setDescription('Add intro for user')
            .addStringOption(option => option.setName('filename').setDescription('filename of .mp3')))
        .addSubcommand(subcommand => subcommand.setName('remove').setDescription('Remove intro for user')
            .addUserOption(option => option.setName('user').setDescription('Remove user\'s intro')))

]

export {
    registerIntros,
    commands
}
