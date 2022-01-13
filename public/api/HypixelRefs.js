const fetch = require('node-fetch')

exports.getGuildByName = function(key, name) {
    return fetch(`https://api.hypixel.net/guild?key=${key}&name=${name}`)
        .then(body => JSON.parse(body))
        .catch( (error) => {
            console.log(error)
        })
}

exports.createUserprofile = function(uuid, key) {
    return fetch(`https://api.hypixel.net/skyblock/profiles?key=${key}&uuid=${uuid}`)
        .then(raw => raw.json())
        .then(data => data.profiles)
        .catch((error) => {
            console.log(error)
        })
}

exports.profile_latest_save = async function(arr, id) {
    var max;
    var profile_num;
    for (var i=0 ; i < arr.length ; i++) {
        if (arr[i].hasOwnProperty("members")) {
            if (max == null || parseInt(arr[i].members[id].last_save) > parseInt(max)) {
            max = arr[i].members[id].last_save;
            profile_num = i;
            }
        }
        else {
            if (max == null || parseInt(arr[i][id].last_save) > parseInt(max)) {
                max = arr[i][id].last_save;
                profile_num = i;
            }
        }
    }
    return profile_num;
  }

exports.hypixelProfile = function(uuid, key) {
    return fetch(`https://api.hypixel.net/player?key=${key}&uuid=${uuid}`)
        .then(raw => raw.json())
        .then(data => data.player)
        .catch((error) => {
            console.log(error)
        })
}