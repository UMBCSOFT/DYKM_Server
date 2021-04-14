class Player {
    constructor(nickname) {
        this.nickname = nickname;
    }

    // The player is given a default nickname at the start, and they can change it before the game starts
    changeNickname(nicknamne) {
        //TODO: Make sure this isn't called outside of the game lobby screen. We don't want people changing nicknames mid game
        this.nickname = nickname;
    }
}

module.exports = Player;