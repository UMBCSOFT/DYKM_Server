const fs = require('fs');
// This chunk of code allows us to store routes in different files.
// For instance, in rooms.js, I can have the room-related GET and POST requests
// We can also have a game.js file. This should help us organize things.
module.exports = function(app){
    fs.readdirSync(__dirname).forEach(function(file) {
        if (file === "routes_index.js") return;
        const name = file.substr(0, file.indexOf('.'));
				if (name === '') return;
				console.log("Name: " + name);
        require("./" + name)(app);
    });
}
