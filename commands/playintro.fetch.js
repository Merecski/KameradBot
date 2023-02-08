import fetch from "node-fetch";
import { getUsers } from "../database/basic.fetch.js";


/**
 * 
 * @param {string} id 
 * @param {boolean} intro_enable 
 * @param {string} intro_file 
 */
function updateUserIntro(id, intro_enable, intro_file) {
    var newData = {
        userid: id,
        intro_enable: intro_enable,
        intro_file: intro_file
    }

    getUsers(newData.userid)
    .then((data) => {
        for (const [key, value] of Object.entries(newData)) {
            data[key] = value
        }
        fetch('http://127.0.0.1:8080/users', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Accept':'application/json'
            }
        })
        .then(res => res.text())
        .catch(err => { throw err });
    })
}

/**
 * Just returns all of the user data.
 * This could be done better.
 * @param {string|null} id 
 * @returns {Promise<JSON>}
 */
async function getUserIntro(id) {
    const data = await getUsers(id)
    .catch(err => { throw err });
    return data.map(({userid, intro_enable, intro_file}) => ({userid, intro_enable, intro_file}));
}

export {
    getUserIntro,
    updateUserIntro
}