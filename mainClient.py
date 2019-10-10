#! /usr/bin/env python3
import discord
import logging
import signal
import os
import youtube_dl

from dotenv import load_dotenv
from discord.ext import commands
from time import sleep
from sys import exit

logging.basicConfig(format='[%(levelname)s][%(funcName)s][%(lineno)s]: %(message)s')
LOG = logging.getLogger()
LOG.setLevel(logging.INFO)

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
GUILD = os.getenv('DISCORD_GUILD')

client = commands.Bot(command_prefix='=')
players = {}

@client.event
async def on_ready():
    print('Command prefix to conrol the bot: ', client.command_prefix)
    print('logged on as {0}!'.format(client.user))
    print(f'{client.user} is connected to the following guild:')
    for guild in client.guilds:
        print(f'{guild.name}(id: {guild.id})')
        members = '\n - '.join([member.name for member in guild.members[:10]])
        print(f'Ten guild members:\n - {members}')

@client.event
async def on_message(message):
    print('Message recieved from {0.author}: {0.content}'.format(message))
    if message.content == 'shutdown':
        await client.close()

@client.command(pass_context=True)
async def join(ctx):
    LOG.info('Joining channel')
    channel = ctx.message.author.voice.voice_channel
    await client.join_voice_channel(channel)

@client.command(pass_context=True)
async def leave(ctx):
    server = ctx.message.server
    voice_client = client.voice_client_in(server)
    await voice_client.disconnect()

@client.command(pass_context=True)
async def play(ctx, url):
    LOG.info("Play command activated")
    author = ctx.message.author
    voice_channel = author.voice_channel
    vc = await client.join_voice_channel(voice_channel)

    player = await vc.create_ytdl_player(url)
    players[server.id] = player
    player.start()

if __name__ == '__main__':
    #bot = BotClient()
    #bot = commands.Bot(command_prefix = '=')
    client.run(TOKEN)
