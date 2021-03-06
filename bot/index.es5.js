exports.initialize = function() {
    var TelegramBot = require("node-telegram-bot-api");
    var _ = require("lodash");
    var config = require("../config");
    
    var bot = new TelegramBot(config.telegram.token, { polling: true });
    var previousMealTime = null;
    var isMealTime = false;
    var selectedInterval = null;
    var dayMealsCounter = 0;
    var timerId = null;
    var photos = ['../images/1.jpg', '../images/2.jpg', './images/3.jpg', './images/4.jpg', './images/5.jpg'];
    var intervals = [{
      time: 2 * 1000 * 60,
      text: 'Раз в 2 мин'
    }, {
      time: 4 * 1000 * 60,
      text: 'Раз в 4 мин'
    }, {
      time: 10 * 1000 * 60,
      text: 'Раз в 10 мин'
    }, {
      time: 15 * 1000 * 60,
      text: 'Раз в 15 мин'
    }, {
      text: 'Потом'
    }];
    var trelloBoards = null;
    
    bot.on('message', (message) => {
      const { chat: { id }} = message;
      console.log(message)

      if (message.text === 'Хочу посмотреть доски') {
        getBoards().then(options => {
          trelloBoards = options.boards;
            bot.sendMessage(id, 'Выбирай', {
              reply_markup: {
                keyboard: options.mappedNames,
                one_time_keyboard: true
              }
            });
          });
      }

      if (message.text.substring(0, 6) === 'Доска:') {
        onBoardSelected(id, message);
      }
    
      // switch(true) {
      //   case 'Хочу посмотреть доски'.test(message.text):
      //   console.log('доски')
      //   //   getBoards().then(options => {
      //   //   trelloBoards = options.boards;
      //   //     bot.sendMessage(id, 'Выбирай', {
      //   //       reply_markup: {
      //   //         keyboard: options.mappedNames
      //   //       }
      //   //     });
      //   //   });
      //     break;
      //   // case /^Доска: /.test(message.text):
      //   //   onBoardSelected(id, message);
      //   //   break;  
      //   case '/track_breakfast'.test(message.text):
      //     onTrackBreakfastCommand(id, message);
      //     break;
      //   case 'Когда еда?'.test(message.text):
      //     onAskWhenNextMeal(id, message);
      //     break;
      //   case 'Да, поел'.test(message.text):
      //     previousMealTime = new Date(message.date * 1000);
      //     var leftMealsCounter = 5 - dayMealsCounter;
      //     bot.sendMessage(id, 'Это хорошо, осталось еще ' + leftMealsCounter + ' раза и можно спать :)');
      //     startTimer(id);
      //     break;
      //   case 'Еще нет'.test(message.text):
      //     bot.sendMessage(id, 'Отложите дела на пару минут, на сытую голову и думаться лучше будет!');
      //     startTimerForCheck(id);
      //     break;
      //   case intervals[0].text.test(message.text):
      //     onIntervalSelect(id, intervals[0]);
      //     break;
      //   case intervals[1].text.test(message.text):
      //     onIntervalSelect(id,intervals[1]);
      //     break;
      //   case intervals[2].text.test(message.text):
      //     onIntervalSelect(id, intervals[2]);
      //     break;
      //   case intervals[3].text.test(message.text):
      //     onIntervalSelect(id, intervals[3]);
      //     break;
      //   case '/start'.test(message.text):
      //     bot.sendMessage(id, "Добро пожаловать. Отметьте время завтрака командой /track_breakfast и отвечайте на вопросы бота.");
      //     break;
      //   default:
      //     bot.sendMessage(id, 'Неизвестная команда');
      //     break
      // }
    });
    
    var onTrackBreakfastCommand = function(id, message) {
      previousMealTime = new Date(message.date * 1000);
      bot.sendMessage(id, 'Завтрак зарегестрирован в ' + previousMealTime.getHours() + ':' + previousMealTime.getMinutes());
      if (selectedInterval) {
        startTimer(id);
      } else {
        getTheInterval(id);
      }
    };
    
    var getTheInterval = function(id) {
      var mealIntervals = _.map(intervals, interval => {
        return [interval.text];
      });
      bot.sendMessage(id, 'Как часто Вы кушаете?', {
        reply_markup: {
          keyboard: mealIntervals,
          one_time_keyboard: true
        }
      });
    };
    
    var onAskWhenNextMeal = function(id, message) {
      if (selectedInterval && previousMealTime) {
        if (isMealTime) {
          bot.sendMessage(id, 'Сейчас!');
        } else {
          var date = new Date();
          var fromLastMealTillNowDiff = (date.getTime() - previousMealTime.getTime());
          var value = (selectedInterval.time - fromLastMealTillNowDiff);
          var response = 'Следующий раз через ' + msToHMS(value);
    
          bot.sendMessage(id, response);
        }
      } else {
        getTheInterval(id);
        // onAskWhenNextMeal(id, message);
      }
    };
    
    var onIntervalSelect = function(id, interval) {
      selectedInterval = interval;
      bot.sendMessage(id, 'Спасибо! Я подскажу Вам, когда пора будет перекусить');
      if (previousMealTime) {
        startTimer(id);
      }
    };
    
    var startTimer = function(id) {
      isMealTime = false;
    
      var date = new Date();
      var fromLastMealTillNowDiff = (date.getTime() - previousMealTime.getTime());
      var delay = selectedInterval.time - fromLastMealTillNowDiff;
      timerId = setTimeout(function() {
          if (++dayMealsCounter === 5) {
            clearInterval(timerId);
            dayMealsCounter = 0;
            bot.sendMessage(id, 'Хух, на сегодня, пожалуй, хватит. Доброй ночи!');
          } else {
            var min = 1;
            var max = 5;
            var randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
            bot.sendMessage(id, 'Пора кушать');
            isMealTime = true;
            startTimerForCheck(id);
          }
      }, delay);
    };
    
    var startTimerForCheck = function(id) {
      setTimeout(function() {
        bot.sendMessage(id, 'Вы поели?', {
          reply_markup: {
            keyboard: [['Да, поел'], ['Еще нет']],
            one_time_keyboard: true
          }
        })
      }, 1000 * 60 * .5);
    }
    
    var msToHMS = function(ms) {
        // 1- Convert to seconds:
        var seconds = ms / 1000;
        // 2- Extract hours:
        var hours = parseInt( seconds / 3600 ); // 3,600 seconds in 1 hour
        seconds = seconds % 3600; // seconds remaining after extracting hours
        // 3- Extract minutes:
        var minutes = parseInt( seconds / 60 ); // 60 seconds in 1 minute
        // 4- Keep only seconds not extracted to minutes:
        seconds = Math.round(seconds % 60);
        return hours + " ч " + minutes + " м " + seconds + " с ";
    };

    var axios = require("axios");
    var _ = require("lodash");
    var config = require("../config");
    var routes = require("../trello/routes");

    var getBoards = function() {
      return new Promise((resolve, reject) => {
        var getBoardsNames = function({ data: boards }) {
            var boardNames = _.map(boards, board => {
              return ['Доска: ' + board.name];
            });
            return boardNames;
        };
    
        var onErrorCallback = function(error) {
            console.error(error);
        };
    
        axios
            .get(routes.getUserBoardsUrl())
            .then((response) => {
              resolve({ boards: response.data, mappedNames: getBoardsNames(response) });
            }, onErrorCallback);
      });
    };

    var onBoardSelected = function(id, message) {
      if (trelloBoards) {
        var board = _.find(trelloBoards, { name: message.text.replace('Доска: ', '')});
        axios
          .get(routes.getBoardsCardsUrl(board.id))
          .then(response => {
            var cards = _.map(response.data, card => {
              return card.name;
            })
            bot.sendMessage(id, 'Вот задачи: ' + cards.join('\n'));
            console.log(response.data);
          })
      }
    };
};
