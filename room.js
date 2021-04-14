class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
    }

    update(app, timePasted) {
        for(let player of this.players) {
            player.connection.timeSinceLastHeartbeatSent += timePasted;
            if(player.connection.timeSinceLastHeartbeatSent > app.heartbeatInterval) {
                player.connection.timeSinceLastHeartbeatSent -= app.heartbeatInterval;
                player.connection.ws.send("PING");
                console.log(`Pinging player ${player.nickname} in room ${this.id}`);
            }
        }
    }
}

module.exports = Room;