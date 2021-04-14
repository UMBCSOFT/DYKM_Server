class Connection {
    constructor(ws) {
        this.ws = ws;
        this.messages = []; // Messages from the websocket will be pushed onto this queue and then will be read from in the room's update function
        this.joinedRoom = false;
    }
}

module.exports = Connection;