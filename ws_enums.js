const MessageType = {
    HEARTBEAT: 'heartbeat',
    STATE_CHANGE: 'state_change',
    SEND_MESSAGE: 'send_message',
}

const States = {
    MAIN_MENU: 'main_menu',
    CREATE_GAME_MENU: 'create_game_menu',
    JOIN_GAME_MENU: 'join_game_menu',
    SETTINGS_MENU: 'settings_menu',
    INSTR_MENU: 'instr_menu',
    GAME_READY: 'game_ready',
    GAME_READY_HOST: 'game_ready_host',
    GAME_QUESTION: 'game_question',
    GAME_MATCH: 'game_match',
    GAME_ROUND_END: 'game_round_end',
    GAME_END: 'game_end'
}