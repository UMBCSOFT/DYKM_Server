const express = require('express');
const settings = require('./settings')
const app = express();
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const rooms = require('routes/rooms');

app.heartbeatInterval = 15000; // 15 seconds

//
function updateRooms(app) {
  for(let room of app.rooms.values()) {
    room.update(app, settings.updateInterval);
  }
}

// create http server and websocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: settings.WebsocketPort })

// get all routes in /routes and register them
require('./routes/routes_index')(app);

// This is where websocket connections remain until they send a join room message.
// We need this because there's no way to connect to a single room without sending that message of the websocket, which means
// there is an intermediate state where you're connected to the websocket server but haven't joined a room yet
let connectedButNotInRoom = [];
app.rooms = new Map();
rooms

app.listen(process.env.PORT || settings.PORT, () => {
  console.log(`Listening at http://localhost:${process.env.PORT || settings.PORT}`);
});

// This returns the test page on http://localhost so we can send test requests easily
app.get('/', function(req, res){
  res.sendFile( path.join(__dirname + '/test_platform/index.html'));
});

setInterval(updateRooms, settings.updateInterval, app);

// export all functions for unit testing
module.exports = {
  updateRooms: updateRooms,
  server: server,
  wss: wss
};

