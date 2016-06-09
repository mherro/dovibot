var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

var moment = require('moment');
var utilities = require('./utilities');

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
var VIEW_COMMAND = "view";
var SUBMIT_COMMAND = "submit";
var PROJECT_COMMAND = "project";
var TASKS_COMMAND = "tasks";
var INFO_COMMAND = "info";


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
      
      } else if(commandToken === PROJECT_COMMAND) {
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

      } else if(commandToken === ENTER_COMMAND) {
          // Command format:
          // > enter Hackathon Development 2016-06-08 8 "Worked on slackico"

          if(messageTokens.length < 6) {
            console.log(ENTER_COMMAND + ": Not enough data");
            rtm.sendMessage('Error! Command format: ' + ENTER_COMMAND + ' Hackathon Development 2016-06-08 8 "Worked on slackico"', message.channel);
            return;
          }

          var userProjectName = messageTokens[1].toLowerCase();
          var userTaskName = messageTokens[2].toLowerCase();
          var userDate = messageTokens[3];
          var userHours = messageTokens[4];
          var userDescription = '';


          var projectId = 0;
          var taskId = 0;

          // validate date
          var dateValid = moment(userDate, "YYYY-MM-DD").isValid();

          if(dateValid === false) {
            console.log(ENTER_COMMAND + ": Invalid date " + userDate + ", must be YYYY-MM-DD");
            rtm.sendMessage('Error! Date must be in format YYYY-MM-DD', message.channel);
          }


          // validate hours
          var userHoursFloat = parseFloat(userHours);

          if(isNaN(userHoursFloat)) {
            console.log(ENTER_COMMAND + ": Invalid hours " + userHours);
            rtm.sendMessage('Error! Hours must be a decimal: ' + userHours, message.channel);
            return;
           
          }


          for(var i = 5; i < messageTokens.length; i++) {
            userDescription += messageTokens[i] + ' ';
          }

          // validate description
          if(userDescription.length === 0) {
            console.log(ENTER_COMMAND + ": Description is required ");
            rtm.sendMessage('Error! Description is required', message.channel);
            return;
          }


          // Look up project ID
          dovico.getProjects(username).then(function(projects){

            console.log(projects);

            rtm.sendMessage('projects listed!', message.channel, function messageSent() {
              console.log("projects listed");
            });


            projects.Assignments.forEach(function(assignment) {

              var projectName = assignment.Name.toLowerCase();
              console.log('projectName: ' + projectName + ', userProjectName: ' + userProjectName);

              if(projectName === userProjectName) {
                  console.log('Found it! ' + assignment.ItemID)
                  projectId = assignment.ItemID;
              }

            });


            if(projectId === 0) {
              console.log('Project ' + userProjectName + ' not found');
              rtm.sendMessage('Project ' + userProjectName + ' not found', message.channel);
            } else {

                console.log('Getting tasks for project ' + projectId)

                dovico.getTasks(username, projectId).then(function(tasks){

                  console.log(tasks);

                  tasks.Assignments.forEach(function(task) {

                    var taskName = task.Name.toLowerCase();

                    if(taskName === userTaskName) {
                      console.log("Found task: " + taskName)
                      taskId = task.ItemID;

                    }

                  });

                  console.log("Task ID: " + taskId);

                  if(taskId == 0) {
                    console.log('Task ' + userTaskName + ' not found');
                    rtm.sendMessage('Task ' + userTaskName + ' not found', message.channel);  
                  } else {

                    dovico.enterTime(username, projectId, taskId, userDate, userHours, userDescription, function(err, res) {

                      if(err){
                        console.log('Error getting token', err);
                        rtm.sendMessage('Error saving time!', message.channel);  
                      } else {
                        console.log('Successfully entered time');
                        rtm.sendMessage('Time successfully saved! :smile:', message.channel);  
                      }

                    });

                  }

                });
            }


          });


      } else if(commandToken === VIEW_COMMAND) {
        var startDate,endDate;
        if(messageTokens[1] === "today"){ 
          endDate = startDate = utilities.today();
        } else {
          startDate = utilities.startOfWeek();
          endDate = utilities.endOfWeek();
        }  
        dovico.viewTime(username, startDate, endDate).then(function(time){
            rtm.sendMessage('Time for ' + startDate + ' to ' + endDate + '\n' + time, message.channel, function messageSent() {
              console.log("view time" , time);
            });
          },
          function(error){
           rtm.sendMessage('Error listing time', message.channel, function messageSent() {
              console.log("Error listing time", error );
            });
          }
        );
      } else if(commandToken === TASKS_COMMAND) {
          // Command format:
          // > tasks"
          // Look up all tasks for a given user

 	        var projectId = messageTokens[1];

          dovico.getTasks(username, projectId).then(function(tasks){
         
            rtm.sendMessage('tasks listed!', message.channel, function messageSent() {
              console.log("tasks listed" + tasks);
            });
          },
          function(error){
           rtm.sendMessage('Error listing tasks', message.channel, function messageSent() {
              console.log("Error listing tasks");
            });
          });

      } else if(commandToken === SUBMIT_COMMAND) {

        var startDate = utilities.startOfWeek();
        var endDate = utilities.endOfWeek();

        dovico.submitTime(username, startDate, endDate, function(error, result) {
          if(error) {
            console.log("Error!", error);
            rtm.sendMessage('Error submitting time: ' + error, message.channel);
          } else {
            rtm.sendMessage('Time Submitted!', message.channel);
          }


        });



      } else if(commandToken === INFO_COMMAND) {
        console.log("getting info");
        store.getToken(username, function(error, token) {
          if(!error){
            rtm.sendMessage('Got token: ' + token , message.channel, function messageSent() {
              console.log("Got token");
            });
          } else {
            rtm.sendMessage('Error getting token', message.channel, function messageSent() {
              console.log("Error getting token", err);
            }); 
          } 
        });

        dovico.getUserId(username, function(error, userId) {
          if(!error){
            rtm.sendMessage('User ID: ' + userId, message.channel, function messageSent() {
              console.log("Got user ID");
            });
          } else {
            rtm.sendMessage('Error getting userId', message.channel, function messageSent() {
              console.log("Error getting userId", err);
            }); 
          } 
        });

        //dovico.getUserId(username).then(function(userId) {
            //rtm.sendMessage('Got userId: ' + userId, message.channel, function messageSent() {
              //console.log("Got userId");
            //});
        //}, function(error) {
            //rtm.sendMessage('Error getting userId', message.channel, function messageSent() {
              //console.log("Error getting userId", err);
            //}); 
          //} 
        //);
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



