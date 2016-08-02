var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var moment = require('moment');
var utilities = require('./common/utilities');
var store = require('./component/store');
var core = require('./core/core');
var cron = require('./core/cron');

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token, {logLevel: 'debug', dataStore: new MemoryDataStore({}) });


rtm.on(RTM_EVENTS.HELLO, function (hello) {
	console.log("HELLO!");
});


rtm.on(RTM_EVENTS.MESSAGE, function (message) {
  // Listens to all `message` events from the team
  console.log('SOMEONE IS TALKING');
  
  console.log('My ID: ' + rtm.activeUserId);
  console.log('From ID: ' + message.user);
  
  if(message.subtype === "message_changed") {
    console.log("Ignoring message edit");
    return;
  }

  if(message.subtype === "bot_message") {
    console.log("Ignoring bot message");
    return;
  }

  if(!message.user) {
    console.log("Message user not specified");
    return;
  }

  var user = rtm.dataStore.getUserById(message.user);

  console.log("user: " + user);

  if(!user) {
    console.log("Message user not in data store: " + message.user);
    return;
  }

  var username = rtm.dataStore.getUserById(message.user).name
  var channelGroupOrDM = rtm.dataStore.getChannelGroupOrDMById(message.channel);

  console.log("IT WAS FROM: %s IN %s [%s] (DM? %s)", username, channelGroupOrDM.name, message.channel, channelGroupOrDM.is_im);

  if(channelGroupOrDM.is_im === true) {
    
     var messageTokens = message.text.split(/[ ]+/);

    if(messageTokens.length > 0) {

      var commandToken = messageTokens[0].toLowerCase();
      if(core.commands[commandToken]){ // functions that do not require a token to be setup
        core.commands[commandToken](rtm,message, username, messageTokens); 
        return;
      }

      //the rest of the command require a token, so check if the user has a token yet
      store.getToken(username, function(error, token) {
        if(!error && token){
          console.log('all else', token);
          if(core.tokenCommands[commandToken]){ // functions that do require a token to be setup
            core.tokenCommands[commandToken](rtm,message, username, messageTokens); 
          } else {
            rtm.sendMessage('command not found try `help`', message.channel);
          }
        } else {
          rtm.sendMessage('Error getting token. Please use `help` on how to enable your token.', message.channel, function messageSent() {
            console.log("Error getting token", error);
          }); 
        } 
      });
    }
  }
});


rtm.start();

cron.init(rtm);




