const GameStates = require("./enums/e_game_states");

class Room {
    constructor(id, host = "None", initialState = GameStates.GAME_READY) {
        this.id = id;
        this.players = [];
        this.host = host;
        this.state = initialState;
        this.numRounds = 1;
    }

    getQuestion() {
        return "THIS IS A TEST QUESTION";
    }

    notifyEveryoneOfPlayerChange() {
        for(let player of this.players) {
            player.connection.ws.send("PLAYERUPDATE " + this.players.map(x=>x.nickname).join(";")); // TODO: People can put a semicolon in their name and break this
        }
    }

    update(app, timePassed) {
        for(let player of this.players) {
            // Heartbeat if enough time has passed
            player.connection.timeSinceLastHeartbeatSent += timePassed;
            if(player.connection.timeSinceLastHeartbeatSent > app.heartbeatInterval) {
                player.connection.timeSinceLastHeartbeatSent -= app.heartbeatInterval;
                player.connection.ws.send("PING");
                console.log(`Pinging player ${player.nickname} in room ${this.id}`);
            }

            // Handle messages from each player
            while(player.connection.messages.length > 0) {

                const message = player.connection.messages.shift(); // Pull the oldest message off the message queue
                console.log("Received message: ".concat(message));

                // Handle game messages here
                //e.g. if(message.startsWith("..."))
                if(message.startsWith("CHANGENICK")) {
                    const nickname = message.substr("CHANGENICK ".length);
                    console.log("Changing nickname of player " + player.nickname + " to " + nickname)
                    player.nickname = nickname;
                    this.notifyEveryoneOfPlayerChange();
                }
                else if(message.startsWith("START GAME")) {
                    for(let p of this.players) {
                        p.connection.ws.send("TRANSITION QUESTION " + this.getQuestion());
                    }
                }
                else if(message.startsWith("SETNUMROUNDS ")) {
                    let rest = message.substr("SETNUMROUNDS ".length);
                    this.numRounds = parseInt(rest);
                    console.log("Setting number of rounds to " + rest);
                }
                else {
                    console.log("Unhandled message " + message);
                }
            }
        }
    }
}

module.exports = Room;