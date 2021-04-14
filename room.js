class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
    }

    update(app, timePasted) {
        for(let player of this.players) {
            // Heartbeat if enough time has passed
            player.connection.timeSinceLastHeartbeatSent += timePasted;
            if(player.connection.timeSinceLastHeartbeatSent > app.heartbeatInterval) {
                player.connection.timeSinceLastHeartbeatSent -= app.heartbeatInterval;
                player.connection.ws.send("PING");
                console.log(`Pinging player ${player.nickname} in room ${this.id}`);
            }

            // Handle messages from each player
            while(player.connection.messages.length > 0) {

                const message = player.connection.messages.shift(); // Pull the oldest message off the message queue
                // TODO: Handle game messages here
                //if(message.startsWith("..."))
            }
        }
    }
}

module.exports = Room;