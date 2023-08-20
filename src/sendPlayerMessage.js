// sendPlayerMessage.js
module.exports.sendPlayerMessage = function(player, type, data = undefined) {
    let obj = {"type": type};
    obj["data"] = data ? data : undefined;
    let message = JSON.stringify(obj);
    player.connection.ws.send(message);
};