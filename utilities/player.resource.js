import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior, joinVoiceChannel, getVoiceConnection } from '@discordjs/voice'
import { ReactionUserManager } from 'discord.js'

class Player {
    /**
     * 
     * @param {number} id 
     * @param {AudioPlayer} player 
     */
    constructor(id, player) {
        this.id = id
        this.player = player
        this.channelId = 0
        this.queue = []

        this.player.on(AudioPlayerStatus.Idle, () => {
            if (this.queue.length == 0) return
            player.play(this.queue.shift());
        })

        this.player.on('error', error => {
            console.error('Error:', error.message, 'with track', error.resource.metadata.title);
        });
    }
}

class PlayerResource {
    constructor() {
        /**
         * @param {Object} guildId ID of the guild
         * @param {Player} guildId.Player Unique player for the guild
         */
        this.audioPlayer = new Object()
    }

    connect(interaction, resource) {
        const guild = interaction.client.guilds.cache.get(interaction.guildId)
        const member = guild.members.cache.get(interaction.member.id)
        const voiceChannel = member.voice.channel
        console.log(`Joining: ${voiceChannel.name}`)
        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        })
        this.playPlayer(interaction.guildId, resource)
    }

    newPlayer(guildId) {
        if (this.audioPlayer.hasOwnProperty(guildId)) ReactionUserManager
        let player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        this.audioPlayer[guildId] = new Player(guildId, player)
    }

    getPlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        return this.audioPlayer[guildId]
    }

    playPlayer(guildId, resource) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        const connection = getVoiceConnection(guildId)
        if (connection) {
            this.audioPlayer[guildId].player.play(resource)
            connection.subscribe(this.audioPlayer[guildId].player)
            return this.audioPlayer[guildId].player
        } else {
            console.error('Attempted to play, but there was no connection')
        }
    }

    stopPlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        const connection = getVoiceConnection(guildId)
        if (connection === undefined) return // just forget about it
        this.audioPlayer[guildId].player.pause()
        connection.destroy()
    }

    pausePlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) return
        this.audioPlayer[guildId].player.pause()
    }

    resumePlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) return
        this.audioPlayer[guildId].player.unpause()
    }

    addQueue(guildId, resource) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        this.audioPlayer[guildId].queue.push(resource)
    }

    clearQueue(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        this.audioPlayer[guildId].queue = []
    }

    skipPlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        if (this.audioPlayer[guildId].queue.length > 0) {
            this.audioPlayer[guildId].player.play(this.audioPlayer[guildId].queue.shift())
            console.log("Remaining queue:",this.audioPlayer[guildId].queue[0])
        } else {
            this.audioPlayer[guildId].player.pause()
        }
    }
}

export {
    PlayerResource
}