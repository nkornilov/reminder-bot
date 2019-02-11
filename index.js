var config = require("./config");
var express = require("express");
var ReminderBot = require("./bot/index.es5");
var TrelloAPI = require("./trello/index.es5");


// TrelloAPI.initialize();
ReminderBot.initialize();

// const app = express();
// app.listen(config.app.port, () => {
//   console.log("listen:port:", config.app.port);
// });
