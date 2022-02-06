import { SlashCommandBuilder } from '@discordjs/builders'
import { checkPartial } from '#utils/utils'
import { config } from '#utils/config'


class BasedCounter {
    constructor(client) {
        import('../database/database.js').then(db => {
            this.pool = db.pool;
            this.loadData();
        })
        this.based = new Object();
        this.client = client;
        this.registerCommands();
    }

    // Register all realated interactions
    registerCommands() {
         this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
        	const { commandName } = interaction;
            if (commandName === 'basedcount') {
                interaction.reply({content: `Based counter: ${this.count(interaction.user.id)}`, ephemeral: true})
            }
        })
    
         this.client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot || await checkPartial(reaction)) return
            if (config.debug && reaction.message.channel.name !== 'bot-testing') return
            // if (!config.debug && user.author === reaction.author) return
            this.handleBasedReactions(reaction)
        });

        this.client.on('messageCreate', async msg => {
            if (msg.author.bot || await checkPartial(msg)) return
            if (config.debug && msg.channel.name !== 'bot-testing') return
            this.handleBasedMsgs(msg)
        });
    }

    // Load based data from database
    loadData() {
        this.pool.query("SELECT * FROM based", (err, result, fields) => {
            if (err) throw err
            const tmp = JSON.parse(JSON.stringify(result))
            console.log('Loaded based data:', tmp)
            for (const user of tmp) {
                this.based[user.userid] = user.count;
            }
        })
    }

    // Update database for specific user
    update(id) {
        console.log(`Updating user ${id} with count ${this.count(id)}`)
        this.pool.query(`UPDATE based SET count = ${this.count(id)} WHERE userid = '${id}'`, (err, result, fields) => {
            if (err) throw err
        })
    }

    add(msg) {
        let id = msg.author.id;
        if (typeof id !== "string") return;
        if (id in this.based) {
            this.based[id] += 1;
        } else {
            this.pool.query(`INSERT INTO based (userid, count) VALUES ('${id}', 1)`, (err) => {
                if (err) throw err
            })
            this.based[id] = 1;
            msg.reply(`Congratulations ${msg.author.username} your first based content!`);
        }
        if (this.based[id] && this.based[id] % 100 === 0) {
            msg.reply(`Your based counter has reached ${this.based[id]}`);
        }
        this.update(id)
    }

    remove(id) {
        if (id in this.based) {
            this.based[id] -= 1;
        } else {
            this.based[id] = 0;
        }
    }

    count(id) {
        console.log('Getting count for', id)
        console.log(this.based)
        return this.based[id] ? this.based[id] : 0;
    }

    async handleBasedMsgs(msg) {
        if (msg.type === 'REPLY' && msg.content.toLowerCase() === "based") {
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId)
            this.add(repliedTo);
            repliedTo.react(this.client.emojis.cache.find(emoji => emoji.name === 'based'))
        }
    }

    handleBasedReactions(reaction) {
        if (reaction.emoji.name === 'based') {
            this.add(reaction.message);
            console.debug("Updated counter: ", this.based)
        }
    }
}

const commands = [
    new SlashCommandBuilder().setName('basedcount').setDescription('Replies with user total based count.'),
]

export {
    BasedCounter,
    commands
};
