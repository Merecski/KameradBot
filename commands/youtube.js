import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    getVoiceConnection,
    VoiceConnectionStatus,
    NoSubscriberBehavior,
    entersState
} from '@discordjs/voice';
import { SlashCommandBuilder } from '@discordjs/builders'
import { connect } from './voice.js'
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

           if (commandName == 'testIgnore') {
                console.log("runnning test command");
                this.joinChanneltest(voiceChannel);
                interaction.reply('playing...');
                this.createPlayer(voiceChannel, this.testurl);
                // this.play(voiceChannel, this.testurl);
            } else if (commandName === 'play') {
                if (interaction.options.getSubcommand() === 'url') {
                    console.log(`Connecting to ${member.voice.channel.name} with ${member.user.tag} !`);
                    this.createPlayer(voiceChannel, interaction.options.getString('url'))
                        .then((res) => {
                            interaction.reply(`Playing ${interaction.options.getString('url')}`)
                        }).catch(err => {
                            interaction.reply(`${err.toString()}`)
                        });
                } else if (interaction.options.getSubcommand() === 'search') {
                    interaction.reply('playing...')
                    console.log(`Connecting to ${member.voice.channel.name} with ${member.user.tag} !`);
                    const searchWords = interaction.options.getString('search')
                    const url = await this.search(searchWords)
                    if (url) {
                        this.createPlayer(voiceChannel, url);
                    } else {
                        interaction.reply(`No results found for ${searchWords}`)
                    }
                }

            }
       })
   }

    getID(channel) {
        return channel.guild.id
    }

    createPlayer(chan, url) {
        return new Promise((resolve, reject) =>{
            play.stream(url).then(stream => {
                console.log(stream)
                connect(chan, stream.stream, stream.type)
                resolve()
            }).catch(error => {
                reject(error)
            })
        })
    }

    async search(args) {
        console.log(`Searching YouTube for: '${args}'`)
        let yt_info = await play.search(args, { limit: 5 })
        if (yt_info.length === 0) {
            console.log('FAILED TO FIND A VIDEO?')
            return ''
        }
        // TODO HANDLE FAILED SERACHES

        console.log(`Found video: ${yt_info}`)
        return yt_info[0].url
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
    new SlashCommandBuilder().setName('play').setDescription('Plays a Youtube video')
        .addSubcommand(subcommand => subcommand.setName('url').setDescription('url link to Youtube video or Soundcloud song')
            .addStringOption(option => option.setName('url').setDescription('Enter youtube url').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('search').setDescription('search term for Youtube video')
            .addStringOption(option => option.setName('search').setDescription('Enter keywords').setRequired(true))),
]

export {
    YoutubePlayer,
    commands
};
