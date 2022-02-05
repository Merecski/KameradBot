import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState 
} from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders'
import ytdl from 'ytdl-core-discord';
import play from 'play-dl'

class YoutubePlayer {
    constructor(client) {
        // this.conn = new VoiceConnection()
        this.player = {}
        this.client = client
        this.testurl = 'https://www.youtube.com/watch?v=jNm_wrWquPs'
        this.connectionIDs = {}
        this.dispatcher = {}
        this.registerCommands()
    }

    registerCommands() {
        this.client.on('interactionCreate', async interaction => {
           if (!interaction.isCommand()) return;
           const { commandName } = interaction;
           const guild = this.client.guilds.cache.get(interaction.guildId); // Getting the guild.
           const member = guild.members.cache.get(interaction.user.id); // Getting the member.
           const voiceChannel = member.voice.channel
           if (!voiceChannel) {
                console.log(`${member.user.tag} is not connected.`);
                return
           }

           if (commandName == 'test') {
                console.log("runnning test command")
                this.joinChanneltest(voiceChannel)
                interaction.reply('playing...')
                this.play(voiceChannel, 'not used');
            } else if (commandName === 'play') {
                interaction.reply('playing...')
                console.log(`Connecting to ${member.voice.channel.name} with ${member.user.tag} !`);
                this.joinChanneltest(voiceChannel);
                this.play(voiceChannel, interaction.options.getString('url'));
            } else if (commandName === 'pause') {
                interaction.reply('paused.')
                this.pause(voiceChannel)
            } else if (commandName === 'resume') {
                this.resume(voiceChannel)
                interaction.reply('resuming...')
            } else if (commandName === 'stop') {
                interaction.reply('stopped.')
                this.stop(voiceChannel);
            }
       })
   }

    getID(channel) {
        return channel.guild.id
    }

    joinChannel(channel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });

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

        this.connectionIDs[connection.joinConfig.guildId] = connection.joinConfig;
    }

    async joinChanneltest(channel) {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });
    }

    async play(chan, url) {
        const connection = getVoiceConnection(this.getID(chan))
        if (!connection) return
        const player = createAudioPlayer();
        const stream = await ytdl(url, {filter: "audioonly"})
        const resource = createAudioResource(stream);
        player.play(resource);
        player.on('stateChange', (oldState, newState) => {
            console.log(`AudioPlayer traitioned from ${oldState.status} to ${newState.status}`);
        });
        connection.subscribe(player)
        console.log('player.subscribers', player.subscribers)
        this.dispatcher[connection.joinConfig.guildId] = player;
    }

    createPlayer() {

    }

    getPlayer(chan) {
        return new Promise((res, rej) =>{
            const id = this.getID(chan)
            const player = this.dispatcher[id]
            if (player) res(player);
            else rej(new Error(`Player ${id} not found`));
        })

    }

    pause(chan) {
        this.getPlayer(chan)
            .then( pl => { pl.pause(); })
            .catch( err => { console.error(err)})
    }

    resume(chan) {
        this.getPlayer(chan)
            .then( pl => { pl.unpause(); })
            .catch( err => { console.error(err)})

    }

    stop(chan) {
        const connection = getVoiceConnection(this.getID(chan))
        if (!connection) return
        connection.destroy();
    }
}

const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a Youtube video')
        .addStringOption(option => option.setName('url').setDescription('Enter youtube url').setRequired(true)),
    new SlashCommandBuilder().setName('stop').setDescription('Stops player'),
    new SlashCommandBuilder().setName('queue').setDescription('Adds video to queue'),
    new SlashCommandBuilder().setName('pause').setDescription('Pause audio'),
    new SlashCommandBuilder().setName('resume').setDescription('Resume audio'),
]

export {
    YoutubePlayer,
    commands
};
