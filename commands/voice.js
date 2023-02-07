import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    VoiceConnectionStatus,
    getVoiceConnection
} from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders'


/**
 * Dictionary of AudioPlayers that have been created
 * @type {AudioPlayer}
 */
var dispatcher = {}

/**
 * Player idle timer
 * @global
 */
let timer = {}

// This is a debug monitor interval
// setInterval(() => {
//     const d = new Date()
//     console.log(`[${d.getMilliseconds()}] Audio Players: ${Object.keys(dispatcher)}`)
// }, 2000)

const timeoutDisconnect = (player, conn) => {
    timer = setTimeout(() => {
        player.stop()
        // This keeps causing errors. Find a better way
        //conn.destroy()
      }, 30 * 60 * 1000); // 30 minutes
  }

function registerVoiceCommands(client) {
    client.on('interactionCreate', async interaction => {
       if (!interaction.isCommand()) return;
       const { commandName } = interaction;
       const guild = client.guilds.cache.get(interaction.guildId); // Getting the guild.
       const member = guild.members.cache.get(interaction.user.id); // Getting the member.
       const voiceChannel = member.voice.channel
       if (!voiceChannel) {
            console.log(`${member.user.tag} is not connected.`);
            return
       }
       if (commandName === 'pause') {
            interaction.reply({content: 'paused' , ephemeral: true})
            pause(voiceChannel)
        } else if (commandName === 'resume') {
            resume(voiceChannel)
            interaction.reply({content: 'resuming...', ephemeral: true})
        } else if (commandName === 'stop') {
            interaction.reply({content: 'stopped.', ephemeral: true})
            stop(voiceChannel);
        }
    })
}

function connect(channel, stream, options) {
    return new Promise((resolve, reject) => {
        const voiceConnId = channel.guild.id
        try {
            let connection = getVoiceConnection(voiceConnId)
            if (!connection) {
                console.log(`Creating new VoiceConnection for Guild[${voiceConnId}]`)
                connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: voiceConnId,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                addVoiceConnListeners(connection)
            }

            let player = getPlayer(channel)
            if (!player) {
                console.log(`Creating new AudioPlayer for Guild[${voiceConnId}]`)
                player = createAudioPlayer( {
                    noSubscriber: 'Pause'
                });
                addPlayerListeners(player, connection)
            }

            const resource = createAudioResource(stream, { 
                    inputType: options
                });
            player.play(resource);


            connection.subscribe(player)
            dispatcher[voiceConnId] = player;
            resolve()
        } catch (error) {
            console.log('voice/connect errored out!!!!')
            reject(error)
        }
    })
}

function getPlayer(chan) {
    const id = chan.guild.id
    const player = dispatcher[id]
    if(!player) console.log(`AudioPlayer Guild[${id}] not found`)
    return player
}

function pause(chan) {
    const pl = getPlayer(chan)
    if (pl) pl.pause()
}

function resume(chan) {
    const pl = getPlayer(chan)
    if (pl) pl.unpause()
}

function stop(chan) {
    const pl = getPlayer(chan)
    if (pl)  pl.stop()
    // Do we want it to disconnect here?
    // const connection = getVoiceConnection(chan.guild.id)
    // if (connection) connection.destroy();
}

function addVoiceConnListeners(connection) {
    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
        }
    });
}

function addPlayerListeners(player, connection) {
    player.on("error", (error) => {
        connection.destroy()
        console.error('Player broke :(', error)
    })

    player.on('stateChange', (oldState, newState) => {
        console.log(`AudioPlayer transitioned from ${oldState.status} to ${newState.status}`);
        if (newState.status === 'idle') {
            clearTimeout(timer)
            timeoutDisconnect(player, connection)
        } else if (oldState.status === 'idle') {
            console.log('Canceling Timeout')
            clearTimeout(timer)
        }
    });
}

function validateYouTubeUrl(url) {
    if (url != undefined || url != '') {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if(match && match[2].length == 11) return true;
    }
    return false
}

const commands = [
    new SlashCommandBuilder().setName('stop').setDescription('Stops player'),
    new SlashCommandBuilder().setName('queue').setDescription('Adds video to queue'),
    new SlashCommandBuilder().setName('pause').setDescription('Pause audio'),
    new SlashCommandBuilder().setName('resume').setDescription('Resume audio'),
]

export {
    connect,
    registerVoiceCommands,
    commands
}