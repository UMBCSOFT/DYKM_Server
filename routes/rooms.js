const { v4: uuidv4 } = require('uuid');

class Room {
    constructor(id) {
        this.id = id;
    }
}

rooms = new Map()

// put all routes in this function! these will be automatically registered.
module.exports = function(app){
    app.get('/room/get/:id', (req, res) => {
        const room = rooms[req.params.id];
        if(room === undefined) {
            res.status(500).send(`No such room exists with id ${req.params.id}`);
            return;
        }
        res.send(room);
    });

    app.post('/room/create', (req, res) => {
        const id = uuidv4();
        let room = new Room(id);
        rooms[id] = room;
        res.send(room);
    });
}