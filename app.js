var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var moment = require('moment');
var utilities = require('./utilities');
var cron = require('./cron');

var token = process.env.SLACK_API_TOKEN || '';

//var token = 'GET TOKEN FROM ENV VARIABLE';

var rtm = new RtmClient(token, {logLevel: 'debug', dataStore: new MemoryDataStore({}) });


var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var store = require('./store');
var core = require('./core');

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

  if(message.user === null) {
    console.log("Message user not specified");
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
          rtm.sendMessage('Error getting token. Please use help on how to enable your token.', message.channel, function messageSent() {
            console.log("Error getting token", error);
          }); 
        } 
      });
    }
  }
});


rtm.start();

cron.init(rtm);

function censor(censor) {
  var i = 0;

  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
      return '[Circular]'; 

    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;  
  }
}



