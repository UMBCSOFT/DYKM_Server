const express = require('express');
const settings = require('./settings')
const app = express();
const PORT = 1337;
const WebsocketPort = 4567;
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Player = require('./player');
const Connection = require('./connection');

function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}


// create http server and websocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: WebsocketPort })

// get all routes in /routes and register them
require('./routes/routes_index')(app);

app.rooms = new Map();
// This is where websocket connections remain until they send a join room message.
// We need this because there's no way to connect to a single room without sending that message of the websocket, which means
// there is an intermediate state where you're connected to the websocket server but haven't joined a room yet
let connectedButNotInRoom = [];

wss.on('connection', (ws) => {
  let connection = new Connection(ws);
  connectedButNotInRoom.push(connection);
  ws.on('message', (message) => {
    if(message === "PONG")
    {
      ws.send("PONG ACK");
      return;
    }

    if(connection.joinedRoom){
      // Push onto queue for the room update function to read later
      connection.messages.push(message);
    }
    else if(message.startsWith('JOIN ')) {
      let roomCode = message.substr("JOIN ".length);
      let room = app.rooms.get(roomCode);
      if(room !== undefined) {
        // Remove connection from the unconnected state, and add it as a new player to the room
        removeItemOnce(connectedButNotInRoom,connection);
        let player = new Player("Player" + (room.players.length + 1));
        player.connection = connection;
        room.players.push(player);
        ws.send("WELCOME " + player.nickname);
      }
    }
    else {
      throw new Error(`Haven't joined room a yet but received a non JOIN message "${message}"\nA join message must be sent before sending other websocket messages`)
    }
  });
  ws.send(`Connection received. Waiting for JOIN message...`);
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Listening at http://localhost:${process.env.PORT || PORT}`);
})
// This returns the test page on http://localhost so we can send test requests easily
app.get('/', function(req, res){
  res.sendFile( path.join(__dirname + '/test_platform/index.html'));
});

function updateRooms(app) {
  for(let room of app.rooms.values()) {
    room.update(app);
  }
}

setInterval(updateRooms, 200, app);