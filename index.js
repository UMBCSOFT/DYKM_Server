const express = require('express');
const settings = require('./settings')
const app = express();
const PORT = process.env.PORT || 1337;
const http = require('http');
const WebSocket = require('ws');

// create http server and websocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

// get all routes in /routes and register them
require('./routes/routes_index')(app);

wss.on('connection', (ws) => {
  ws.on('message', (message) => {

    //log the message and send back (little test)
    console.log(`received: ${message}`);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.send('Hi there. This is a WS server.');
});

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
})

