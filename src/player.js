const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(nickname, isHost=false) {
        this.setNickname(nickname);
        this.isHost = isHost
        this.connection = undefined; // Connection will be set once JOIN message is recieved
        this.id = uuidv4();
        this.answer = undefined;
        this.doneMatching = false;
        this.readyNextRound = false;
        this.matches = [];
        this.numCorrectMatches = 0;
        this.score = 0;
    }

    setNickname(n){
        console.log("n:", n);
        if(n === "" || n === "undefined" || !n) {
            n = "Player" + Math.floor(Math.random() * 1000000000); // not perfect but good enough
        }
        console.log("Changing player nick to", n);
        this.nickname = n.replace(/;/g, ':'); // We use semicolons for things so names can't have them
    }

    resetForNewRound() {
        this.answer = undefined;
        this.doneMatching = false;
        this.matches = [];
        this.numCorrectMatches = 0;
        this.score = 0;
    }
}

module.exports = Player;
