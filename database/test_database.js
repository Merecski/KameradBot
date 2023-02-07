import fetch from "node-fetch";

function getUsersTest() {
    fetch('http://127.0.0.1:8080/users')
    .then(res => res.json())
    .then(out => console.log('getUsersTest response: ', out))
    .catch(err => { throw err });
}

async function addUserTest() {
    var payload = {
        userid: '47',
        username: 'Username1234',
    }
    
    await fetch('http://127.0.0.1:8080/users', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Accept':'application/json'
        }
    })
    .then(res => res.text())
    .then(out => console.log('addUserTest response: ', out))
    .catch(err => { throw err });
}

async function modifyUserTest() {
    var payload = {
        userid: '47',
        username: 'FakeUser',
        bot: true,
        based: 9999,
        intro_enable: false,
        intro_file: 'fake/intro_file.mp3'
    }
    
    await fetch('http://127.0.0.1:8080/users', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Accept':'application/json'
        }
    })
    .then(res => res.text())
    .then(out => console.log('modifyUserTest response: ', out))
    .catch(err => { throw err });
}

async function deleteUserTest() {
    var payload = {
        userid: '47'
    }
    
     await fetch('http://127.0.0.1:8080/users/delete', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Accept':'application/json'
        }
    })
    .then(res => res.text())
    .then(out => console.log('deleteUserTest response: ', out))
    .catch(err => { throw err });
}

await addUserTest()
await modifyUserTest()
await deleteUserTest()