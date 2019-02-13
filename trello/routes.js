var config = require("../config");
var getQuery = function () {
    return `?key=${config.trello.key}&token=${config.trello.token}`;
};

exports.getUserBoardsUrl = function(memderId) {
    return `${config.trello.host}/members/${config.trello.memberId}/boards${getQuery()}`;
}

exports.getBoardsCardsUrl = function(boardId) {
    return `${config.trello.host}/boards/${boardId}/cards${getQuery()}`;
}