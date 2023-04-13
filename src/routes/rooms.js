const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');


const Room = require('../room');

// put all routes in this function! these will be automatically registered.
module.exports = function(app){
    app.use(bodyParser.urlencoded({ extended: true  }));
    app.use(bodyParser.json());

    app.get('/room/get/:id', (req, res) => {
        const room = app.rooms.get(req.params.id);
        if(room === undefined) {
            res.status(500).send(`No such room exists with id ${req.params.id}`);
            return;
        }
        // Respond with what IP the client should connect to
        res.status(200).send("ws://localhost:" + app.websocketPort); // TODO: Once released this needs to return the IP of our live server
    });

    app.post('/room/create', (req, res) => {
        let room = new Room();
        let roomCode = room.roomCode;
        let jsonData = req.body;
        room.numRounds = jsonData["numRounds"];
        room.gamePack = jsonData["gamePack"];
        app.rooms.set(roomCode, room);
        console.log(`Created room: ${roomCode} - ${app.rooms.size}`);
        res.send(JSON.stringify({ roomCode: roomCode}));
    });
}
