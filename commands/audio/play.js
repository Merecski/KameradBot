import { SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioResource, createAudioPlayer, NoSubscriberBehavior, AudioPlayer } from '@discordjs/voice'
// import { VoiceConnectionStatus, AudioPlayerStatus } from '@discordjs/voice'
import { getVoiceConnection } from '@discordjs/voice'
import play from 'play-dl'; // Everything

const testFile = "INVALID_FILE"

/**
 * @param {Object} guildId ID of the guild
 * @param {Object} [guildId.AudioPlayer] Unique player for the guild
 */
let audioPlayer = {}

async function playAudio(interaction) {
    console.log(`Test: ${interaction.member.voice?.channel.name}`)
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel');
        return
    }

    const guild = interaction.client.guilds.cache.get(interaction.guildId); // Getting the guild.
    const member = guild.members.cache.get(interaction.user.id); // Getting the member.
    const voiceChannel = member.voice.channel
    
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator
    })

    if (interaction.options.getSubcommand() !== 'url') {
        await interaction.reply('URL failed');
        return
    }
    
    /*
    if you want to get info about youtube link and then stream it

    let yt_info = await play.video_info(args)
    console.log(yt_info.video_details.title) 
    let stream = await play.stream_from_info(yt_info)
    */

    let resource
    const url = interaction.options.getString('url')
    if (url !== 'test') {
        console.log(`Attempting to play via url: ${url}`)
    
        let stream = await play.stream(url)
    
        resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
    } else {
        url = testFile
        console.log(`Attempting to play: ${url}`)
        resource = createAudioResource(url)
    }


    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    })

    player.play(resource)

    // Subscribe the connection to the audio player (will play audio on the voice connection)
    const subscription = connection.subscribe(player);

    

    // // subscription could be undefined if the connection is destroyed!
    // if (subscription) {
    //     // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
    //     setTimeout(() => subscription.unsubscribe(), 5_000);
    // }

    audioPlayer[interaction.guildId] = player
    await interaction.reply(`Playing video: ${url}`)
}

async function destroyAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }

    const connection = getVoiceConnection(interaction.guildId)
    connection.destroy()
    await interaction.reply('Stopped audio player')
}

async function pauseAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }

    const id = interaction.guildId

    if (audioPlayer.hasOwn(id)) {
        audioPlayer[id].pause()
        await interaction.reply('Stopped audio player')
    } else {
        await interaction.reply('No player avaliable')
    }
}

async function resumeAudio(interaction) {
    if (!interaction.member.voice?.channel) {
        await interaction.reply('Not in voice channel')
        return
    }

    audioPlayer.unpause()
    await interaction.reply('Stopped audio player')
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
    }
]

export {
    commands,
}