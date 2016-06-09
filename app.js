var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var token = process.env.SLACK_API_TOKEN || '';

//var token = 'GET TOKEN FROM ENV VARIABLE';

var rtm = new RtmClient(token, {logLevel: 'debug', dataStore: new MemoryDataStore({}) });


var RTM_EVENTS = require('@slack/client').RTM_EVENTS;


var dovico = require('./dovico');

var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('redis connected');
});

rtm.on(RTM_EVENTS.HELLO, function (hello) {

	console.log("HELLO!");

	// console.log('ID: ' + rtm.ID);
	// console.log('Team: ' + rtm.team);

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

    if(messageTokens.length > 1) {

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
              console.log("Error message sent");
            });  
          }
        );
      } else if(commandToken === ENTER_COMMAND) {

          if(messageTokens.length < 6) {
            console.log(ENTER_COMMAND + ": Not enough data");
            rtm.sendMessage('Not enough data!', message.channel);
            return;
          }


          // Command format:
          // > enter Hackathon Development 2016-06-08 8 "Worked on slackico"


          // Look up project ID
          dovico.getProjects(username).then(function(projects){

            console.log(projects);

            rtm.sendMessage('projects listed!', message.channel, function messageSent() {
              console.log("projects listed");
            });

            var projectName = messageTokens[1].toLowerCase();

            projects.Assignments.forEach(function(assignment) {

              var assignmentName = assignment.Name.toLowerCase();

              if(assignmentName === projectName) {

                var projectCode = assignment.ProjectID;
                var projectID = assingment.ItemID;

                dovico.getTasks(projectID).then(function(tasks) {

                  var taskName = messageTokens[2].toLowerCase();


                });

              }


            });



          },
          function(error){
           rtm.sendMessage('Error listing projects', message.channel, function messageSent() {
              console.log("Error listing projects");
            });
          });

          // Look up task ID


          // date;
      
          // hours;
        

          // description;


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



