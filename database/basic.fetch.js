import fetch from "node-fetch";

/**
 * 
 * @param {string} id 
 * @returns 
 */
async function getUsers(id) {
    var addr = "http://127.0.0.1:8080/users"
    addr = addr + (id ? "/" + id : "")
    var data = await fetch(addr)
    .then(res => res.json())
    .catch(err => { throw err });
    return data
}

export {
    getUsers
}