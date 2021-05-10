const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(nickname, isHost=false) {
        this.setNickname(nickname);
        this.isHost = isHost
        this.intervalIdSender = undefined;
        this.connection = undefined; // Connection will be set once JOIN message is recieved
        this.id = uuidv4();
        this.answer = undefined;
        this.doneMatching = false;
        this.readyNextRound = false;
        this.matches = [];
        this.numCorrectMatches = undefined;
        this.score = undefined;
    }

    setNickname(n){
        if(n === "" || n === undefined) {
            n = "Player" + Math.floor(Math.random() * 1000000000); // not perfect but good enough
        }
        this.nickname = n.replace(/;/g, ''); // We use semicolons for things so names can't have them
    }
}

module.exports = Player;