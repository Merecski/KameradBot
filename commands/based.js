import { SlashCommandBuilder, codeBlock } from '@discordjs/builders'
import { checkPartial } from '#utils/utils'
import { config } from '#utils/config'
import { table } from 'table'


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
            } else if (commandName === 'basedboard') {
                const rows = interaction.options.getInteger('rows')
                let userReq = interaction.options.getUser('user')
                userReq = userReq ? userReq : interaction.user
                this.getUsernames(userReq, rows).then(table => {
                    interaction.reply({content: codeBlock(table), ephemeral: true})
                })
            }
        })

         this.client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot || await checkPartial(reaction)) return
            if (config.debug && reaction.message.channel.name !== 'bot-testing') return
            if (!config.debug && user.author === reaction.author) return
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

    async getUsernames(requester, max) {
        let output = []
        let tableConfig = {}
        let finalOutput = [["Username", "Count", "You"]]
        const minCount = finalOutput.length
        const absoluteMax = 100 // Absolute max number of rows displayed
        const defaultMax = 10 // Absolute max number of rows displayed
        const maxLimit = max ? Math.min(Math.max(1, max), absoluteMax) : defaultMax // If requested max is
        const youPointer = '<---'
        for (const [id, value] of Object.entries(this.based)) {
            try {
                var user = await this.client.users.fetch(id)
            } catch (error) {
                console.log(`Skipping userid ${id} (Probably a dev id?)`)
                continue
            }
            const you = id === requester.id ? youPointer : ''
            output.push([user.username, value, you])
        }
        output.sort((a, b) => {
            return b[1] - a[1]
        })

        let title = `BASED COUNTER`

        if (output.length > maxLimit) {
            // Centering table on current user
            const centerYouIndex = output.findIndex(row => row[2] === youPointer)
            const beforePre = centerYouIndex - Math.floor(maxLimit / 2)
            const afterPre = centerYouIndex + Math.ceil(maxLimit / 2)
            const before = Math.max(0, beforePre - Math.min(0, output.length - afterPre))
            const after = Math.min(output.length, afterPre - Math.min(0, beforePre))
            console.log(`${maxLimit}, ${centerYouIndex}, beforePre ${beforePre}, afterPre ${afterPre}, after: ${after}`)

            tableConfig['spanningCells'] = []
            if (before > 0) {
                finalOutput.push([`${before} more user${before === 1 ? '' : 's'} ahead...`, '', ''])
                tableConfig['spanningCells'].push({ col: 0, row: 1, colSpan: 3})
            }
            if (after - before > 0) finalOutput = finalOutput.concat(output.slice(before, after))
            if (output.length > after) {
                finalOutput.push([`${output.length - after} more user${output.length - after === 1 ? '' : 's'} remaing...`, '', ''])
                tableConfig['spanningCells'].push({ col: 0, row: finalOutput.length - 1, colSpan: 3})
            }

            title = title + `\nDisplaying ${maxLimit} rows`
        } else {
            finalOutput = output
        }
        tableConfig['header'] = { content: title }
        console.log(finalOutput)
        return table(finalOutput, tableConfig)
    }

    // Update database for specific user
    update(id) {
        console.log(`Updating user ${id} with count ${this.count(id)}`)
        this.pool.query(`UPDATE users SET based = ${this.count(id)} WHERE userid = '${id}'`, (err, result, fields) => {
            if (err) throw err
        })
    }

    add(msg) {
        let id = config.debug ? '474747' : msg.author.id;
        let username = msg.author.username;
        if (typeof id !== "string") return;
        if (id in this.based) {
            this.based[id] += 1;
        } else {
            this.pool.query(`INSERT INTO based (userid, count) VALUES ('${id}', 1)`, (err) => {
                if (err) throw err
            })
            this.based[id] = 1;
            msg.reply(`Congratulations ${username} your first based content!`);
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
        return this.based[id] ? this.based[id] : 0;
    }

    async handleBasedMsgs(msg) {
        if (msg.type === 'REPLY' && msg.content.toLowerCase() === "based") {
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId)
            this.add(repliedTo);
            // const guild = this.client.guilds.cache.get(msg.guildId); // Getting the guild.
            // const member = guild.emojis.cache.find(emoji => emoji.name === 'based'); // Getting the member.
            repliedTo.react(this.client.emojis.cache.find(emoji => emoji.name === 'based')) // This ain't right
            console.log(`${msg.author.username} gave ${repliedTo.author.username} +1 based`)
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
    new SlashCommandBuilder().setName('basedboard').setDescription('Repleis with the complete scoreboard')
        .addIntegerOption(option => option.setName('rows').setDescription('Max number of rows to print'))
        .addUserOption(option => option.setName('user').setDescription('Center on specific user')),
    new SlashCommandBuilder().setName('basedrank').setDescription('Repleis with the complete scoreboard'),
]

export {
    BasedCounter,
    commands
};
