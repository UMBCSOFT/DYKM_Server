const { v4: uuidv4 } = require('uuid');

const Room = require('../room');

// put all routes in this function! these will be automatically registered.
module.exports = function(app){
    app.get('/room/get/:id', (req, res) => {
        const room = app.rooms.get(req.params.id);
        if(room === undefined) {
            res.status(500).send(`No such room exists with id ${req.params.id}`);
            return;
        }
        // Respond with what IP the client should connect to
        res.send("ws://localhost:" + app.websocketPort); // TODO: Once released this needs to return the IP of our live server
    });

    app.post('/room/create', (req, res) => {
        const id = uuidv4();
        let room = new Room(id);
        app.rooms.set(id, room);
        console.log(`Created room: ${id} - ${app.rooms.size}`);
        res.send(room);
    });
}