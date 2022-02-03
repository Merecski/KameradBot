import { SlashCommandBuilder } from '@discordjs/builders'

class BasedCounter {
    constructor(client) {
        this.based = new Object();
        this.client = client;
    }

    add(msg) {
        let name = msg.author.username;
        if (typeof name !== "string") return;
        if (name in this.based) {
            this.based[name] += 1;
        } else {
            this.based[name] = 1;
            msg.reply(`Congratulations ${msg.author.username} your first based content!`);
        }
        if (this.based[name] && this.based[name] % 100 === 0) {
            msg.reply(`Your based counter has reached ${this.based[name]}`);
        }
    }

    remove(name) {
        if (name in this.based) {
            this.based[name] -= 1;
        } else {
            this.based[name] = 0;
        }
    }

    count(name) {
        return this.based[name] ? this.based[name] : 0;
    }

    async handleBasedMsgs(msg) {
        if (msg.type === 'REPLY' && msg.content.toLowerCase() === "based") {
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId)
            this.add(repliedTo);
            repliedTo.react(this.client.emojis.cache.find(emoji => emoji.name === 'based'))
        }
    }

    async handleBasedReactions(reaction) {
        if (reaction.emoji.name === 'based') {
            this.add(reaction.message);
            console.debug("Updated counter: ", this.based)
        }
    }
}

const commands = [
    new SlashCommandBuilder().setName('basedcount').setDescription('Replies with user total based count.'),
]
function execute(interaction) {
    interaction.reply({content: `Based counter: ${based.count(interaction.user.username)}`, ephemeral: true})
}

export {
    BasedCounter,
    commands,
    execute
};
