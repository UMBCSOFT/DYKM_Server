const express = require('express');
const settings = require('./settings')
const app = express();
const PORT = 1337;
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// create http server and websocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: PORT })

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

app.listen(process.env.PORT || 1337, () => {
  console.log(`Listening at http://localhost:${process.env.PORT || 1337}`);
})
// This returns the test page on http://localhost so we can send test requests easily
app.get('/', function(req, res){
  res.sendFile( path.join(__dirname + '/test_platform/index.html'));
});