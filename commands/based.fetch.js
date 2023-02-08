
import fetch from "node-fetch";
import { getUsers } from "../database/basic.fetch.js";


/**
 * 
 * @param {string} id 
 * @param {int} based 
 */
function updateUserBased(id, based) {
    var newData = {
        userid: id,
        based: based
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
        .then(out => console.log(out))
        .catch(err => { throw err });
    })
}

/**
 * Just returns all of the user data.
 * This could be done better.
 * @param {string|null} id 
 * @returns {Promise<JSON>}
 */
async function getUserBased(id) {
    const data = await getUsers(id)
    .catch(err => { throw err });
    return data
}

export {
    getUserBased,
    updateUserBased
}