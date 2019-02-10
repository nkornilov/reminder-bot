const TelegramBotAPI = require("node-telegram-bot-api");
const _ = require("lodash");
const options = {
  polling: true
};
process.env["NTBA_FIX_319"] = 1;

class ReminderBot {
  constructor(config) {
    this.config = config;
    this.connect();
    this.initListeners();
    this.chats = new Object();
  }

  connect() {
    try {
      this.bot = new TelegramBotAPI(this.config.token, options);
    } catch(error) {
      console.error('reminder:bot:client:initializer', error);
    }
  }

  initListeners() {
    try {
      console.log(this.bot)
      // this.bot.onText(new RegExp('\/start'), this.startHandler);
      this.bot.on('message', this.messageHandler);
    } catch (error) {
      console.error('reminder:bot:listeners:initializer', error);
    }
  }

  startHandler (message, match) {
    console.log(startMessage(message));
    const chatId = this.getChatIdFromMessage(message);
    this.chats[chatId] = message;

    this.bot.sendMessage(chatId, startMessage(message));
  }

  startMessage(message) {
    return 'Hi ' + message.from.first_name + ' ' + message.from.last_name + '!';
  }

  messageHandler(message) {
    console.log(message);
    const chatId = this.getChatIdFromMessage(message);
    this.chats[chatId] = message;

    this.bot.sendMessage(chatId, startMessage(message));
  }

  getChatIdFromMessage(message) {
    return message.hasOwnProperty("chat") ? message.chat.id : message.from.id;
  }
}

module.exports = ReminderBot;
