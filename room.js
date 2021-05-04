const GameStates = require("./enums/e_game_states");
const sqlite3 = require('sqlite3').verbose();

const questionPhaseTimeSeconds = 60;
const questionMatchTimeSeconds = 60;

class Room {
    constructor(id, host = "None", initialState = GameStates.GAME_READY) {
        this.id = id;
        this.players = [];
        this.host = host;
        this.state = initialState;
        this.numRounds = 1;
        this.validGamePacks = ["doyouknowme", "icebreakers"];
        this.gamePack = this.validGamePacks[0];
        this.questions = [];
        this.timerStart = 0;
        this.timerEnd = 0;
    }

    getQuestion() {
        if(this.questions.length <= 0) {
            return "ERROR: Ran out of questions or failed to load question pack";
        }
        return this.questions.splice(Math.floor(Math.random()*this.questions.length), 1)[0]; // Grab a single question and remove it from the array
    }

    loadQuestions(callbackWhenDone) {
        if(this.validGamePacks.indexOf(this.gamePack) < 0) { console.error("Attempted to use load gamepack " + this.gamePack + " but this is not a valid gamepack"); return;} // Don't allow invalid game packs

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

    broadcast(broadcastMessage) {
        for(let p of this.players) {
            p.connection.ws.send(broadcastMessage);
        }
    }

    setupTimer(howLongInSeconds) {
        this.timerStart = new Date().getTime();
        this.timerEnd = this.timerStart + howLongInSeconds * 1000;
    }

    startGame() {
        this.numRounds -= 1;
        for(let player of this.players) {
            player.answer = undefined;
            player.doneMatching = false;
            player.matches = [];
        }
        let question = this.getQuestion();
        this.state = GameStates.GAME_QUESTION;
        this.setupTimer(questionPhaseTimeSeconds);
        this.broadcast("TRANSITION QUESTION " + question);
        console.log("Starting game with " + this.numRounds + " rounds and question pack " + this.gamePack);
        console.log("Setting timer start to " + this.timerStart + " and end to " + this.timerEnd + " which is " + ((this.timerEnd - this.timerStart)/1000.0) + " seconds")
    }

    notifyEveryoneOfPlayerChange() {
        for(let player of this.players) {
            player.connection.ws.send("PLAYERUPDATE " + this.players.map(x=>x.nickname).join(";")); // TODO: People can put a semicolon in their name and break this
        }
    }

    checkIfEveryoneAnsweredAndTransitionIfTheyHave() { // Long but descriptive :shrug:
        for(let player of this.players) {
            if(player.answer === undefined)
                return;
        }
        // If we got here that means everyone has an answer
        this.TransitionQuestionMatch();
    }

    checkIfEveryoneIsDoneMatchingAndTransitionIfTheyHave() {
        for(let player of this.players) {
            if(!player.doneMatching)
                return;
        }
        // If we got here that means everyone has matched
        this.TransitionScore();
    }

    TransitionScore() {
        this.state = GameStates.GAME_ROUND_END;
        this.broadcast("TRANSITION SCORE"); // The client will send their matches once they hear this
    }

    TransitionQuestionMatch() {
        // If we got here that means everyone has an answer
        for (let player of this.players) {
            if(player.answer === undefined) {
                player.answer = "No answer given";
            }
        }
        let nameAnswerPairs = this.players.map(x=>x.nickname + ";" + x.answer + ";");
        // nameAnswerPairs will be a string of tuples of nicknames and answers
        // like "player1;player1answer;player2;player2answer"
        // Then the client will split by ; and grab 2 at a time and make them into pairs again
        this.setupTimer(questionMatchTimeSeconds);
        this.broadcast("TRANSITION QUESTIONMATCH " + nameAnswerPairs);
        this.state = GameStates.GAME_QUESTIONMATCH;
    }

    update(app, timePassed) {
        for(let player of this.players) {
            // Heartbeat if enough time has passed
            player.connection.timeSinceLastHeartbeatSent += timePassed;
            if(player.connection.timeSinceLastHeartbeatSent > app.heartbeatInterval) {
                player.connection.timeSinceLastHeartbeatSent -= app.heartbeatInterval;
                player.connection.ws.send("PING");
                console.log(`Pinging player ${player.nickname} in room ${this.id}`);
            }

            // Handle messages from each player
            while(player.connection.messages.length > 0) {

                const message = player.connection.messages.shift(); // Pull the oldest message off the message queue
                console.log("Received message: ".concat(message));

                // Handle game messages here
                //e.g. if(message.startsWith("..."))
                if(message.startsWith("CHANGENICK")) {
                    const nickname = message.substr("CHANGENICK ".length);
                    console.log("Changing nickname of player " + player.nickname + " to " + nickname)
                    player.nickname = nickname;
                    this.notifyEveryoneOfPlayerChange();
                }
                else if(message.startsWith("START GAME")) {
                    this.loadQuestions(()=>this.startGame());
                }
                else if(message.startsWith("SETNUMROUNDS ")) {
                    let rest = message.substr("SETNUMROUNDS ".length);
                    this.numRounds = parseInt(rest);
                    console.log("Setting number of rounds to " + rest);
                }
                else if(message.startsWith("SETGAMEPACK ")) {
                    let rest = message.substr("SETGAMEPACK ".length);
                    if(this.validGamePacks.indexOf(rest) >= 0) {
                        console.log("Setting game pack to " + rest);
                        this.gamePack = rest;
                    }
                    else {
                        console.log("Invalid game pack name " + rest);
                    }
                }
                else if (message.startsWith("ANSWER ")) {
                    let rest = message.substr("ANSWER ".length);
                    player.answer = rest;
                    console.log("Setting player " + player.nickname + "'s answer to " + player.answer);
                    this.checkIfEveryoneAnsweredAndTransitionIfTheyHave();
                }
                else if (message.startsWith("REQUESTTIMER")) {
                    console.log("Sending timer data to " + player.nickname);
                    player.connection.ws.send("TIMER " + this.timerStart + ";" + this.timerEnd);
                }
                else if (message.startsWith("DONEMATCHING")) {
                    console.log(player.nickname + " is done matching");
                    player.doneMatching = true;
                    this.checkIfEveryoneIsDoneMatchingAndTransitionIfTheyHave();
                }
                else {
                    console.log("Unhandled message " + message);
                }
            }
        }

        if(this.state === GameStates.GAME_QUESTION) {
            if((this.timerEnd - new Date().getTime()) <= 0) {
                this.TransitionQuestionMatch();
            }
        }

        if(this.state === GameStates.GAME_QUESTIONMATCH) {
            if((this.timerEnd - new Date().getTime()) <= 0) {
                this.TransitionScore();
            }
        }
    }
}

module.exports = Room;