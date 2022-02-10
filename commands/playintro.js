import { SlashCommandBuilder } from '@discordjs/builders'
import { connect } from '../voice/voice.js'
import { pool } from '../database/database.js'

/**
 * This is not important enough to be local. Stores the last date someone recieved their intro.
 * Currently this is preped to make sure intros are only ran once a day
 * Format {username: id}
 */
var lastPlayed = {
}

var reserved = {
    'cornpal': {
        id: '204761315808509952',
        file: './sound/intros/john-cena.mp3'
    },
    'alter': {
        id: '159782355723223042',
        file: './sound/intros/hank-hill-rap.mp3'
    }
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
            const enable = interaction.options.getString('enable')
            pool.query(`UPDATE users SET intro_enable = ${enable} WHERE userid = '${id}'`, (err) => {
                if (err) console.log(err)
            })
            interaction.reply({content: `Set intro is ${enable}`, ephemeral: true})
        }
    })
}

function checkRunIntros(joinId, channel) {
    for (const [name, info] of Object.entries(reserved)) {
        const d = new Date();
        // Only run once a day
        if (joinId === info.id) {
            if (d.getDate() === lastPlayed[info.id]) {
                console.log(`${name} already had their intro today`)
                continue
            }
            console.log(`Activating ${name} intro`)
            lastPlayed[info.id] = d.getDate()
            connect(channel, info.file)
        }
    }
}

const commands = [
    new SlashCommandBuilder().setName('intro').setDescription('Enable or disable personal intro')
        .addBooleanOption(option => option.setName('enable').setDescription('true/false').setRequired(true))
]

export {
    registerIntros,
    commands
}
