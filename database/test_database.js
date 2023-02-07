import fetch from "node-fetch";

async function getUserTest(id) {
    var address = "http://127.0.0.1:8080/users"
    address = address + (id ? "/" + id : "")
    var data = await fetch(address)
    .then(res => res.json())
    .then(out => {
        console.log('getUsersTest response: ', out)
        return out
    })
    .catch(err => { throw err });
    return data
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
    .then(res => res.json())
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


async function updateUserBased(id, based) {
    var newData = {
        userid: id,
        based: based
    }

    getUserTest(newData.userid)
    .then((data) => {
        for (const [key, value] of Object.entries(newData)) {
            data[key] = value
        }
        console.log("updateUserBased data being sent: ", data)
        fetch('http://127.0.0.1:8080/users', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Accept':'application/json'
            }
        })
        .then(res => res.text())
        .then(out => {
            console.log('User update response: ', out)
        })
        .catch(err => { throw err });
    })
}

await getUserTest('159782355723223042')
// updateUserBased('474747', 0)
// .then(res => {
//     if (res) {
//         console.log("modified:", res)
//     }
// })
// await addUserTest()
// await modifyUserTest()
// await deleteUserTest()