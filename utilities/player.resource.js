import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, NoSubscriberBehavior } from '@discordjs/voice'
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
        this.audioPlayer[guildId].player.play(resource)
        return this.audioPlayer[guildId].player
    }

    pausePlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
        this.audioPlayer[guildId].player.pause()
    }

    resumePlayer(guildId) {
        if (!this.audioPlayer.hasOwnProperty(guildId)) this.newPlayer(guildId)
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
        if (this.audioPlayer[guildId].queue.length == 0) this.audioPlayer[guildId].pausePlayer()
        this.audioPlayer[guildId].player.play(this.audioPlayer[guildId].queue.shift())
    }
}

export {
    PlayerResource
}