class Room {
    constructor(id) {
        this.id = id;
    }
}

rooms = []

// put all routes in this function! these will be automatically registered.
module.exports = function(app){
    app.get('/get/room/:id', (req, res) => {
        const room = rooms.find(c => c.id === parseInt(req.params.id));
        res.send(room);
    });

    app.post('/create/room', (req, res) => {
        const id = rooms.length + 1;
        let room = new Room(id);
        rooms.push(room);
        res.send(room);
    });
}