const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(nickname, isHost=false) {
        this.nickname = nickname;
        this.isHost = isHost
        this.connection = undefined; // Connection will be set once JOIN message is recieved
        this.id = uuidv4();
        this.answer = undefined;
        this.doneMatching = false;
        this.matches = [];
    }
}

module.exports = Player;