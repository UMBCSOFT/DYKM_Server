const GameStates = require("../enums/e_game_states");
const sqlite3 = require('sqlite3').verbose();
const { humanId } = require('human-id');
const { sendPlayerMessage } = require('./sendPlayerMessage');

const questionPhaseTimeSeconds = 60;
const questionMatchTimeSeconds = 60;

class Room {
    constructor(roomCode = undefined, host = "None", initialState = GameStates.GAME_READY) {
        this.roomCode = roomCode ? roomCode : this.generateId();
        console.log(this.generateId());
        this.players = [];
        this.host = host;
        this.state = initialState;
        this.numRounds = 1;
        this.validGamePacks = ["doyouknowme", "icebreakers"];
        this.gamePack = this.validGamePacks[0];
        this.questions = [];
        this.timerStart = 0;
        this.timerEnd = 0;
        this.timeEmpty = 0;
    }

    generateId() {
        return humanId('-');
    }

    getQuestion() {
        if(this.questions.length <= 0) {
            return "ERROR: Ran out of questions or failed to load question pack";
        }
        return this.questions.splice(Math.floor(Math.random()*this.questions.length), 1)[0]; // Grab a single question and remove it from the array
    }

    loadQuestions(callbackWhenDone) {
        // Don't allow invalid game packs
        if(this.validGamePacks.indexOf(this.gamePack) < 0) {
            console.error("Attempted to use load gamepack " + this.gamePack + " but this is not a valid gamepack");
            return false;
        }

        let filename = './database/' + this.gamePack + '.db';
        let db = new sqlite3.Database(filename, (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Loaded " + filename);
        });
        db.serialize(() => {
            this.questions = [];
            db.all(`SELECT question from questions`, (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                this.questions = rows.map(x=>x.question);
                console.log("Loaded " + this.questions.length + " questions from " + filename);
                db.close();
                if(callbackWhenDone)
                    callbackWhenDone();
            });

        });

    }

    broadcast(type, data = undefined) {
        for(let p of this.players) {
            sendPlayerMessage(p, type, data);
        }
    }

    setupTimer(howLongInSeconds) {
        this.timerStart = new Date().getTime();
        this.timerEnd = this.timerStart + howLongInSeconds * 1000;
    }

    startGame() {
        this.transitionQuestion();
        console.log("Starting game with " + this.numRounds + " rounds and question pack " + this.gamePack);
    }

    playAgain() {
        for(let player of this.players) {
            player.resetForNewRound();
        }
        this.startGame();
    }

    notifyEveryoneOfPlayerChange() {
        console.log("Players:", this.players)
        const playerIdNickname = [];
        for (let p of this.players) {
            playerIdNickname.push({
                "id": p.id,
                "nickname": p.nickname
            });
        }
        console.log("Sending player update:\n", playerIdNickname);
        this.broadcast("PLAYERUPDATE", playerIdNickname);
    }

    checkIfEveryoneAnsweredAndTransitionIfTheyHave() { // Long but descriptive :shrug:
        for(let player of this.players) {
            if(player.answer === undefined)
                return;
        }
        // If we got here that means everyone has an answer
        this.transitionQuestionMatch();
    }

    checkIfEveryoneIsDoneMatchingAndTransitionIfTheyHave() {
        for(let player of this.players) {
            if(!player.doneMatching)
                return;
        }
        // If we got here that means everyone has matched
        this.transitionScore();
    }

    transitionScore() {
        for(let player of this.players) {
            player.readyNextRound = false;
        }
        this.state = GameStates.GAME_ROUND_END;
        this.broadcast("TRANSITION SCORE"); // The client will send their matches once they hear this
    }



    transitionQuestionMatch() {
        // If we got here that means everyone has an answer
        for (let player of this.players) {
            if(player.answer === undefined) {
                player.answer = "No answer given";
            }
        }
        let answersData = [];
        for (let p of this.players) {
            answersData.push({
                "nickname": p.nickname,
                "answer": p.answer
            });
        }
        // nameAnswerPairs will be a string of tuples of nicknames and answers
        // like "player1,player1answer;player2,player2answer"
        // Then the client will split by ; and ,
        this.setupTimer(questionMatchTimeSeconds*this.players.length);
        this.broadcast("TRANSITION QUESTIONMATCH", answersData);
        this.state = GameStates.GAME_QUESTIONMATCH;
    }

    transitionQuestionFromScores() {
        for (let player of this.players) {
            if(player.readyNextRound === false) {
                console.log(player.nickname + "was not ready for the next round");
                return;
            }
        }
        this.resetPlayersNumCorrectMatches();
        console.log("All players are ready for next round");

        for (let player of this.players) {
            player.readyNextRound = false;
        }
        this.numRounds -= 1;
        console.log("Number of rounds set to " + this.numRounds);
        if (this.numRounds >= 1) {
            console.log("Transitioning question")
            this.transitionQuestion();
        }
        else {
            this.state = GameStates.GAME_END;
            console.log("Transitioning end game")
            this.broadcast("TRANSITION ENDGAME");
        }
    }

    transitionQuestion() {
        for(let player of this.players) {
            player.answer = undefined;
            player.doneMatching = false;
            player.matches = [];
        }
        let question = this.getQuestion();
        this.broadcast("TRANSITION QUESTION", question);
        this.setupTimer(questionPhaseTimeSeconds);
        console.log("Setting timer start to " + this.timerStart + " and end to " + this.timerEnd + " which is " + ((this.timerEnd - this.timerStart)/1000.0) + " seconds")
        this.state = GameStates.GAME_QUESTION;
    }

    resetPlayersNumCorrectMatches() {
        for (let p of this.players) {
            p.numCorrectMatches = 0;
        }
    }

    updatePlayerScore(player) {
        for (let m of player.matches) {
            // m[0] is the correct author to the answer
            // m[1] is the answer
            // m[2] is the guessed author
            // m[3] is the guess author's answer (in case we want it)
            if (m[0] === m[2]) {
                player.numCorrectMatches += 1;
            }
        }
        player.score += player.numCorrectMatches;
    }

    update(app, timePassed) {
        if(this.players.length <= 0) {
            this.timeEmpty += timePassed;
        }
        else {
            this.timeEmpty = 0;
        }
        for(let player of this.players) {
            // Heartbeat if enough time has passed
            player.connection.timeSinceLastHeartbeatSent += timePassed;
            if(player.connection.timeSinceLastHeartbeatSent > app.heartbeatInterval) {
                player.connection.timeSinceLastHeartbeatSent -= app.heartbeatInterval;
                player.connection.ws.send("PING 🏓");
                console.log(`🏓 PINGing  player ${player.nickname} in room ${this.roomCode}`);
            }

            // Handle messages from each player
            while(player.connection.messages.length > 0) {

                const message = player.connection.messages.shift(); // Pull the oldest message off the message queue
                console.log("Received message: ".concat(message));

                const jsonData = JSON.parse(message);

                // Handle game messages here
                //e.g. if(jsonData["type"] === "...")
                if(jsonData["type"] === "CHANGENICK") {
                    const nickname = message.substr("CHANGENICK ".length);
                    console.log("Changing nickname of player " + player.nickname + " to " + nickname)
                    player.setNickname(nickname);
                    this.notifyEveryoneOfPlayerChange();
                }
                else if(jsonData["type"] === "STARTGAME") {
                    this.loadQuestions(()=>this.startGame());
                }
                else if(jsonData["type"] === "SETNUMROUNDS") {
                    let rest = jsonData["data"]
                    this.numRounds = parseInt(rest);
                    console.log("Setting number of rounds to " + rest);
                }
                else if(jsonData["type"] === "SETGAMEPACK") {
                    let rest = jsonData["data"];
                    if(this.validGamePacks.indexOf(rest) >= 0) {
                        console.log("Setting game pack to " + rest);
                        this.gamePack = rest;
                    }
                    else {
                        console.log("Invalid game pack name " + rest);
                    }
                }
                else if (jsonData["type"] === "ANSWER") {
                    let rest = jsonData["data"];
                    if(rest === "null" || rest === "undefined") {
                        rest = "No answer given";
                    }
                    player.answer = rest;
                    console.log("Setting player " + player.nickname + "'s answer to " + player.answer);
                    this.checkIfEveryoneAnsweredAndTransitionIfTheyHave();
                }
                else if (jsonData["type"] === "REQUESTTIMER") {
                    console.log("Sending timer data to " + player.nickname);
                    sendPlayerMessage(player, "TIMER", [this.timerStart, this.timerEnd])
                }
                else if (jsonData["type"] === "ISLASTROUND") {
                    console.log("Response: ", this.numRounds === 0);
                    sendPlayerMessage(player, "ISLASTROUND", (this.numRounds === 0))
                }
                else if (jsonData["type"] === "READYNEXTROUND") {
                    console.log(player.nickname + " is ready for next round");
                    player.readyNextRound = true;
                    this.transitionQuestionFromScores();
                }
                else if (jsonData["type"] === "DONEMATCHING") {
                    player.matches = jsonData["data"];
                    this.updatePlayerScore(player);

                    console.log(player.nickname + " is done matching");
                    console.log("Matches:");
                    console.log(player.matches);
                    player.doneMatching = true;
                    this.checkIfEveryoneIsDoneMatchingAndTransitionIfTheyHave();
                }

                else if (jsonData["type"] === "GETPLAYERSCORES") {
                    let playerScores = [];
                    for (let p of this.players) {
                        playerScores.push({
                            "id": p.id,
                            "nickname": p.nickname,
                            "score": p.score,
                            "numCorrectMatches": p.numCorrectMatches
                        });
                    }
                    sendPlayerMessage(player, "PLAYERSCORES", playerScores);
                }
                else if (jsonData["type"] === "PLAYAGAIN") {
                    player.readyNextRound = true;
                    for (let player of this.players) {
                        if (player.readyNextRound === false) {
                            return;
                        }
                    }
                    console.log("All players ready to play again.");
                    this.playAgain();
                }
                else {
                    console.log("Unhandled message " + message);
                }
            }
        }

        if(this.state === GameStates.GAME_QUESTION) {
            if((this.timerEnd - new Date().getTime()) <= 0) {
                this.transitionQuestionMatch();
            }
        }

        if(this.state === GameStates.GAME_QUESTIONMATCH) {
            if((this.timerEnd - new Date().getTime()) <= 0) {
                this.transitionScore();
            }
        }
    }
}

module.exports = Room;
