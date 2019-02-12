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
    var trelloBoards = null;
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
    
    bot.on('message', (message) => {
      const { chat: { id }} = message;
    
      switch(message.text) {
        case 'Хочу посмотреть доски':
        //   getBoards().then(boardNames => {
        //     bot.sendMessage(id, 'Выбирай', {
        //       reply_markup: {
        //         keyboard: boardNames
        //       }
        //     });
        //   });
          break;
        case '/track_breakfast':
          onTrackBreakfastCommand(id, message);
          break;
        case 'Когда еда?':
          onAskWhenNextMeal(id, message);
          break;
        case 'Да, поел':
          previousMealTime = new Date(message.date * 1000);
          var leftMealsCounter = 5 - dayMealsCounter;
          bot.sendMessage(id, 'Это хорошо, осталось еще ' + leftMealsCounter + ' раза и можно спать :)');
          startTimer(id);
          break;
        case 'Еще нет':
          bot.sendMessage(id, 'Отложите дела на пару минут, на сытую голову и думаться лучше будет!');
          startTimerForCheck(id);
          break;
        case intervals[0].text:
          onIntervalSelect(id, intervals[0]);
          break;
        case intervals[1].text:
          onIntervalSelect(id,intervals[1]);
          break;
        case intervals[2].text:
          onIntervalSelect(id, intervals[2]);
          break;
        case intervals[3].text:
          onIntervalSelect(id, intervals[3]);
          break;
        case '/start':
          bot.sendMessage(id, "Добро пожаловать. Отметьте время завтрака командой /track_breakfast и отвечайте на вопросы бота.");
          break;
        default:
          console.log(message.text)
          analyzeText(message.text).then(response => {
            console.log(response);
          })
          // bot.sendMessage(id, 'Неизвестная команда');
          break
      }
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

    var getBoards = function() {
      return new Promise((resolve, reject) => {
        var axios = require("axios");
        var _ = require("lodash");
        var config = require("../config");
        var routes = require("../trello/routes");
        
        var getBoardsNames = function({ data: boards }) {
          trelloBoards = boards;
          return _.map(boards, board => {
            return [board.name];
          });
        };
    
        var onErrorCallback = function(error) {
            console.error(error);
        };
    
        axios
            .get(routes.getUserBoardsUrl())
            .then((response) => {
              resolve(getBoardsNames(response));
            }, onErrorCallback);
      });
    };

    var analyzeText = function(text) {
      return axios({
        method: "POST",
        type: "POST",
        url: `${config.IBM_NLP.host}/api/v1/analyze?version=2018-11-16`,
        headers: { "Content-Type": "application/json" },
        auth: {
          username: 'apikey',
          password: config.IBM_NLP.key
        },
        data: JSON.stringify({
          text: text,
          return_analyzed_text: true,
          features: {
            entities: {
              emotion: true,
              sentiment: true,
              limit: 8
            },
            keywords: {
              emotion: true,
              sentiment: true,
              limit: 8
            }
          }
        })
      });
    } 
};
