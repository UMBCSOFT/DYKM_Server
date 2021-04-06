const express = require('express');
const settings = require('./settings')
const app = express();
const PORT = process.env.PORT || 1337;

// get all routes in /routes and register them
require('./routes/routes_index')(app);

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
})