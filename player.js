const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(nickname, isHost=false) {
        this.nickname = nickname;
        this.isHost = isHost
        this.connection = undefined; // Connection will be set once JOIN message is recieved
        this.id = uuidv4();
    }

    // The player is given a default nickname at the start, and they can change it before the game starts
    //TODO: Delete?
    changeNickname(nickname) {
        //TODO: Make sure this isn't called outside of the game lobby screen. We don't want people changing nicknames mid game
        this.nickname = nickname;
    }
}

module.exports = Player;