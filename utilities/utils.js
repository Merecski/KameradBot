import fs from 'fs'
// import { data } from '../commands/based'
import { config } from '#utils/config'

/** Returns true if an error occurs */
async function checkPartial(msg) {
    if (msg.partial) {
        // When a reaction is received, check if the structure is partial
        try {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            await msg.fetch()
        } catch (error) {
            // Return as `reaction.message.author` may be undefined/null
            console.error("Failed to fetch messageCreate", error)
            return true
        }
    }
    return false
}

// NOTE This is probably getting deleted and replaced with MySQL calls
/**
 * Converts data into a json string indexed as the key then saves
 * the data into the appropreate file.
 * @param {String} key Classifier for data type to index
 *
 * @param {Object} data the The actual data needing to be saved
*/
function saveData(key, data) {
    // const output = {key: data}
    // const jsonData = JSON.stringify(output)
    // fs.writeFile(config.dataFileName, jsonData).catch(err => {
    //     console.error("Failed to save data:", err)
    // })
}

/**
 * Converts data into a json string indexed as the key then saves
 *  the data into the appropreate file.
 * @param {String} key Classifier for data type to index
 *
 * @returns {Object} The information form the file
*/
function getData(key) {
    // fs.readFile(config.dataFileName)
    // const output = {key: data}
    // const jsonData = JSON.stringify(output)
}

export {
    checkPartial,
    saveData,
    getData
}