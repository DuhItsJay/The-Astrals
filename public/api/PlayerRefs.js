const fetch = require('node-fetch') 
    
exports.getId = function(playername) {
    return fetch(`https://api.mojang.com/users/profiles/minecraft/${playername}`)
        .then(data => data.json())
        .then(player => player.id)
        .catch((error) => {
            return 'terminate'
        });
}

exports.playerHead = function(embed, uuid) {
    embed.setThumbnail(`https://cravatar.eu/head/${uuid}`)
}