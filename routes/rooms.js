const { v4: uuidv4 } = require('uuid');
const Player = require('../player');
const Connection = require('../connection');

const Room = require('../room');

// put all routes in this function! these will be automatically registered.
module.exports = function(app){
    // Request to connect to a server room with :id id
    app.get('/room/get/:id', (req, res) => {
        const room = app.rooms.get(req.params.id);
        if(room === undefined) {
            res.status(500).send(`No such room exists with id ${req.params.id}`);
            return;
        }
        // Respond with what IP the client should connect to
        res.send("ws://localhost:4567"); // TODO: Once released this needs to return the IP of our live server
    });

    // Request to create a new server room (as the host, of course)
    app.post('/room/create', (req, res) => {
        const id = uuidv4();
        let room = new Room(id, States.GAME_READY_HOST);
        app.rooms.set(id, room);
        console.log(`Created room: ${id} - ${app.rooms.size}`);
        res.send(room);
    });

    function removeItemOnce(arr, value) {
        let index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    function Join(wss, connectedButNotInRoom) {
        wss.on('connection', (ws) => {
            let connection = new Connection(ws);
            connectedButNotInRoom.push(connection);
            ws.on('message', (message) => {
                if(message === "PONG")
                {
                    ws.send("PONG ACK");
                    console.log("Replying to PONG");
                    return;
                }

                if(connection.joinedRoom){
                    // Push onto queue for the room update function to read later
                    connection.messages.push(message);
                }
                // Since we're not in a room yet we handle JOIN here, but non JOIN messages should be handled in Room.update()
                else if(message.startsWith('JOIN ')) {
                    let roomCode = message.substr("JOIN ".length);
                    message.substr()
                    let room = app.rooms.get(roomCode);
                    if(room !== undefined) {
                        // Remove connection from the unconnected state, and add it as a new player to the room
                        removeItemOnce(connectedButNotInRoom,connection);
                        let player = new Player("Player" + (room.players.length + 1));
                        player.connection = connection;
                        room.players.push(player);
                        player.connection.joinedRoom = true;
                        ws.send("WELCOME " + player.nickname);
                    }
                }
                else {
                    throw new Error(`Haven't joined room a yet but received a non JOIN message "${message}"\nA join message must be sent before sending other websocket messages`)
                }
            });
        });
    }
}