var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var token = process.env.SLACK_API_TOKEN || '';

//var token = 'GET TOKEN FROM ENV VARIABLE';

var rtm = new RtmClient(token, {logLevel: 'debug', dataStore: new MemoryDataStore({}) });


var RTM_EVENTS = require('@slack/client').RTM_EVENTS;


var dovico = require('./dovico');
var store = require('./store');
rtm.on(RTM_EVENTS.HELLO, function (hello) {
	console.log("HELLO!");
});


var SETUP_COMMAND = "setup";
var ENTER_COMMAND = "enter";


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

//  console.log('RTM:' + JSON.stringify(rtm, censor(rtm)));

  var username = rtm.dataStore.getUserById(message.user).name
  var channelGroupOrDM = rtm.dataStore.getChannelGroupOrDMById(message.channel);

  console.log("IT WAS FROM: %s IN %s [%s] (DM? %s)", username, channelGroupOrDM.name, message.channel, channelGroupOrDM.is_im);

  // rtm.sendMessage('I hear that!', 'testdov', function messageSent() {
  // 	console.log('COMPLAINT SENT');
  // });

  // rtm.sendMessage('Stop bothering me', 'G1A1HHUFK', function messageSent() {
  // 	console.log('COMPLAINT SENT');
  // });

//  rtm.sendMessage('Hello, how are you?', '@matt', function messageSent() {
//  	console.log('NICE DM SENT');
//  });

  if(channelGroupOrDM.is_im === true) {
    
    //rtm.sendMessage('Hello, how are you?', message.channel, function messageSent() {
    //  console.log('NICE DM SENT');

    var messageTokens = message.text.split(/[ ]+/);

    if(messageTokens.length > 0) {

      var commandToken = messageTokens[0].toLowerCase();

      var userToken = messageTokens[1];

      if(commandToken === SETUP_COMMAND) {
        dovico.setupToken(username, userToken).then(
          function(result) {
            rtm.sendMessage('Token saved!', message.channel, function messageSent() {
              console.log("Token saved message sent");
            });
          }, function(err) {
            rtm.sendMessage('Error occurred saving token', message.channel, function messageSent() {
              console.log("Error message sent", err);
            });  
          }
        );
      } else if(commandToken === ENTER_COMMAND) {

          if(messageTokens.length < 6) {
            console.log(ENTER_COMMAND + ": Not enough data");
            rtm.sendMessage('Not enough data!', message.channel);
            return;
          }

      } else if(commandToken === "project") {
          // Command format:
          // > project"
          // Look up project ID
          dovico.getProjects(username).then(function(projects){

            console.log(projects);

            rtm.sendMessage('projects listed!', message.channel, function messageSent() {
              console.log("projects listed" + projects);
            });
          },
          function(error){
           rtm.sendMessage('Error listing projects', message.channel, function messageSent() {
              console.log("Error listing projects");
            });
          });
      } else if(commandToken === "tasks") {
          // Command format:
          // > tasks"
          // Look up all tasks for a given user

 	  var projectId = messageTokens[1];

          dovico.getTasks(username, projectId).then(function(tasks){

            console.log(tasks);

            rtm.sendMessage('tasks listed!', message.channel, function messageSent() {
              console.log("tasks listed" + tasks);
            });
          },
          function(error){
           rtm.sendMessage('Error listing tasks', message.channel, function messageSent() {
              console.log("Error listing tasks");
            });
          });
      } else if(commandToken === "info") {
        console.log("getting info");
        store.getToken(username, function(error, token) {
          if(!error){
            rtm.sendMessage('Got token' + token , message.channel, function messageSent() {
              console.log("Got token");
            });
          } else {
            rtm.sendMessage('Error getting token', message.channel, function messageSent() {
              console.log("Error getting token", err);
            }); 
          } 
        });
      }
    }
  }
});


rtm.start();

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



