import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    getVoiceConnection
} from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders'
import play from 'play-dl'

// This is necessary to stream anything from SoundCloud
play.getFreeClientID().then((clientID) => {
    play.setToken({
      soundcloud : {
          client_id : clientID
      }
    })
})

const dispatcher = {}

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
        try {
            const player = createAudioPlayer();
            const resource = createAudioResource(stream, { 
                    inputType: options
                });
            player.play(resource);
            player.on("error", (error) => {
                connection.destroy()
                console.error('Player broke :(', error)
            })

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            connection.subscribe(player)
            dispatcher[connection.joinConfig.guildId] = player;
            // addPlayerListeners(player, connection)
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

function getPlayer(chan) {
    return new Promise((res, rej) =>{
        const id = chan.guild.id
        const player = dispatcher[id]
        if (player) res(player);
        else rej(new Error(`Player ${id} not found`));
    })

}

function pause(chan) {
    getPlayer(chan)
        .then( pl => { pl.pause(); })
        .catch( err => { console.error(err)})
}

function resume(chan) {
    getPlayer(chan)
        .then( pl => { pl.unpause(); })
        .catch( err => { console.error(err)})
}

function stop(chan) {
    const connection = getVoiceConnection(chan.guild.id)
    if (!connection) return
    connection.destroy();
}

function addPlayerListeners(player, connection) {
    player.on('stateChange', (oldState, newState) => {
        console.log(`AudioPlayer transitioned from ${oldState.status} to ${newState.status}`);
        if (newState.status === 'idle') {
            player.stop()
            connection.destroy()
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