import fs from 'fs'
import path from 'path'
import { config } from '#utils/config'

/** Returns true if an error occurs */
async function checkPartial(msg) {
    if (msg.partial) {
        // When a reaction is received, check if the structure is partial
        try {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            await msg.fetch();
        } catch (error) {
            // Return as `reaction.message.author` may be undefined/null
            console.error("Failed to fetch messageCreate", error);
            return true;
        }
    }
    return false;
}

/**
 * This was a pretty good idea but I need to shelf this until
 * I think of a better way of interactions being responsible
 * for objects and their data
 * 
 * @param {Object} client 
 */
async function registerInteractions(client) {
    const absolutePath = path.resolve('./commands');
    fs.readdir(absolutePath, async (err, filenames) => {
        if (err) throw err;
        for (const filename of filenames) {
            const file = path.parse(filename);
            if (file.ext === '.js' && !config.ignoreModules.includes(file.name)) {
                try {
                    const { interactions } = await import(path.join(absolutePath, file.base));
                    if (interactions) interactions(client);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    })
}

export {
    registerInteractions,
    checkPartial
}