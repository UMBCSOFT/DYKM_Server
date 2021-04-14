class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
    }

    //todo: timePasted? why Pasted?
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
                console.log("Received message: ".concat(message));
                // TODO: Handle game messages here
                //if(message.startsWith("..."))
                if(message.startsWith("CHANGENICK")) {
                    const nickname = message.substr("CHANGENICK ".length);
                    player.nickname = nickname;
                    player.connection.ws.send("CHANGENICK ACK ".concat(nickname));
                }
            }
        }
    }
}

module.exports = Room;