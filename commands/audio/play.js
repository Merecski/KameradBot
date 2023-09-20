import { SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioResource, createAudioPlayer, NoSubscriberBehavior, AudioPlayer } from '@discordjs/voice'
import play from 'play-dl'; // Everything


const testFile = "/home/pi/Music/sfw/OK_I_PULL_UP.mp3"

// let playerResource = new PlayerResource()

async function playAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel');
        return
    }
    console.log(`Joining: ${interaction.member.voice?.channel.name}`)
    
    const guild = interaction.client.guilds.cache.get(interaction.guildId); // Getting the guild.
    const member = guild.members.cache.get(interaction.user.id); // Getting the member.
    const voiceChannel = member.voice.channel
    
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator
    })

    /**
     *  TODO: THERE IS A BUG HERE THAT SAYS NO SUBCOMMAND EVEN THOUGH THERE IS.
     *        Please fix this ASAP. Maybe since it's requried it is not needed?
     */
    // console.log("DEBUG", interaction.options)
    // if (interaction.options.getSubcommand() !== 'url') {
    //     await interaction.reply('URL failed');
    //     return
    // }
    
    let resource;
    let url = interaction.options.getString('url')
    
    try {
        let stream = await play.stream(url)
        resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
    } catch (error) {
        console.log(error)
        await interaction.reply(`Failed to play: '${url}'\nYou probably entered the url wrong. Get Mike to check error logs`)
        return
    }


    let player = interaction.client.player.playPlayer(interaction.guildId, resource)

    // Subscribe the connection to the audio player (will play audio on the voice connection)
    const subscription = connection.subscribe(player)

    // // subscription could be undefined if the connection is destroyed!
    // if (subscription) {
    //     // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
    //     setTimeout(() => subscription.unsubscribe(), 5_000);
    // }

    // audioPlayer[interaction.guildId] = player
    await interaction.reply(`Playing video: ${url}`)
}

async function destroyAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }
    interaction.client.player.stopPlayer(interaction.guildId)
    await interaction.reply('Stopped audio player')
}

async function pauseAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }
    interaction.client.player.pausePlayer(interaction.guildId)
    await interaction.reply('Paused audio player')
}

async function resumeAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }

    interaction.client.player.resumePlayer(interaction.guildId)
    await interaction.reply('Resumed audio player')
}

async function queueAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }
    let url = interaction.options.getString('url')
    let stream = await play.stream(url)
    
    console.log(`Attempting to createAudioResource via url: ${url}`)
    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
    interaction.client.player.addQueue(interaction.guildId, resource)
    await interaction.reply(`Song Queued: ${url}`)
}

async function skipAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }

    interaction.client.player.skipPlayer(interaction.guildId)
    await interaction.reply(`Song skipped`)
}

const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('play')
            .setDescription('Plays url')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('url of video')
                    .setRequired(true)),
        execute: playAudio
    },
    {
        data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Destroys audio connection'),
        execute: destroyAudio
    },
    {
        data: new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Pause audio'),
        execute: pauseAudio
    },
    {
        data: new SlashCommandBuilder()
            .setName('resume')
            .setDescription('Resume audio'),
        execute: resumeAudio
    },
    {
        data: new SlashCommandBuilder()
            .setName('queue')
            .setDescription('Queues audio to be played')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('url of video')
                    .setRequired(true)),
        execute: queueAudio
    },
    {
        data: new SlashCommandBuilder()
            .setName('skip')
            .setDescription('Skips the song'),
        execute: skipAudio
    }
]

export {
    commands,
}