import fetch from "node-fetch";
import { config } from "../utilities/config.js";

class UserRowDB {
    constructor() {
        this.userid = ""
        this.username = ""
        this.bot = false
        this.based = 0
        this.intro_enable= false
        this.intro_file = ""
    }
}

/**
 * 
 * @param {string} id 
 * @returns 
 */
async function getUsers(id) {
    var addr = `http://${config.db.addr}/users`
    addr = addr + (id ? "/" + id : "")
    var data = await fetch(addr)
    .then(async res => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok) {
            console.log("getUsers response not ok")
            // get error message from body or default to response status
            const error = (data && data.message) || res.status;
            console.log("===============")
            console.log("res.status: ", res.status)
            console.log("===============")
            return Promise.reject(error);
        }

        return data
    })
    .catch(err => { 
        console.log("getUsers Failed")
        // throw err 
    });
    return data
}

export {
    getUsers
}