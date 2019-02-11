exports.initialize = function () {
    var axios = require("axios");
    var _ = require("lodash");
    var config = require("../config");
    var routes = require("./routes");
    
    var onGetBoards = function({ data: boards }) {
        console.log("----------------BOARDS-------------");
        var boardNames = _.map(boards, 'name');
        console.log(boardNames);
    };

    var onErrorCallback = function(error) {
        console.error(error);
    };

    axios
        .get(routes.getUserBoardsUrl())
        .then(onGetBoards, onErrorCallback)
};

