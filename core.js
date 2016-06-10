var store = require('./store');
var dovico = require('./dovico');
var moment = require('moment');
var utilities = require('./utilities');

var commands = {
  'setup':function(rtm, message, username, messageTokens){
    var userToken = messageTokens[1];
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
  },
  'help':function(rtm,message, username, messageTokens){
    var fs = require('fs'),
      path = require('path');
    var full = path.resolve(__dirname, 'help.txt');
    fs.readFile(path.resolve(__dirname, 'help.txt'), 'utf-8', function(err, data)  {
      if (err) throw err;
      rtm.sendMessage(data, message.channel, function(){
        console.log('help sent')
      });
    });
  }
};

var tokenCommands = {
  'open': function(rtm, message) {
    dovico.openDovico(function(loginUrl) {
      rtm.sendMessage(loginUrl, message.channel, function messageSent() {
        console.log(loginUrl, err);
      });
    });
  },
  'view': function(rtm,message, username, messageTokens) {
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
  },
  'enter': function(rtm,message, username, messageTokens) {
            // Command format:
            // > enter Hackathon Development 2016-06-08 8 "Worked on slackico"
            var ENTER_COMMAND = "enter";
            if(messageTokens.length < 6) {
              console.log(ENTER_COMMAND + ": Not enough data");
              rtm.sendMessage('Error! Command format: ' + ENTER_COMMAND + ' Hackathon Development 2016-06-08 8 Worked on slackico', message.channel);
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

                  dovico.getTasks(username, 'P' + projectId).then(function(tasks){

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

                  },
                  function(error){
                   rtm.sendMessage('Error validating task: ' + error, message.channel, function messageSent() {
                      console.log("Error validating task: " + error);
                    });
                  });
              }
            },
            function(error){
             rtm.sendMessage('Error validating project: ' + error, message.channel, function messageSent() {
                console.log("Error validating project: " + error);
              });
            });
  },
  'delete': function(rtm, message, username, messageTokens) {
    if(messageTokens.length == 1){
      var startDate,endDate;
      startDate = utilities.startOfWeek();
      endDate = utilities.endOfWeek();
      dovico.viewTimeForDelete(username, startDate, endDate).then(function(time){
          rtm.sendMessage('Unsubmitted Time Entries for ' + startDate + ' to ' + endDate + '\n' + time, message.channel, function messageSent() {
            console.log("view time" , time);
          });
        },
        function(error){
         rtm.sendMessage('Error listing time', message.channel, function messageSent() {
            console.log("Error listing time", error );
          });
        }
      );
    } else {
      dovico.deleteTime(username, messageTokens[1], function(error, result){
        if(error) {
         rtm.sendMessage('Error deleting time', message.channel, function messageSent() {
            console.log("Error listing time", error );
          });
        } else {
          rtm.sendMessage('Time deleted\n\r' + result, message.channel, function messageSent() {
            console.log("time delete" , result);
          });
        }
      });
    }
  },
  'info': function(rtm, message, username, messageTokens) {
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
          console.log("Error getting userId", error);
        }); 
      } 
    });
  },
  'submit': function(rtm,message, username, messageTokens){
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

  },
  'project': function(rtm,message, username, messageTokens){
    rtm.sendMessage('command `project` not found, try projects', message.channel);
  },
  'projects':function(rtm,message, username, messageTokens){
    // Command format:
    // > projects"
    // Look up projects
    dovico.getProjects(username).then(function(projects){
      console.log('get projects result', projects);
      var text = "Your Projects:";
      if(projects.Assignments.length > 0){
        projects.Assignments.forEach(function(project){
          text += "\r\n\t" + project.Name;
        });
      } else {
        text = "You have not projects assigned contact your Project Manager";
      }
      rtm.sendMessage(text, message.channel, function messageSent() {
        console.log('projects listed for ' + username);
      });
    },
    function(error){
     rtm.sendMessage('Error listing projects', message.channel, function messageSent() {
        console.log("Error listing projects");
      });
    });
  },
  'tasks': function(rtm, message, username, messageTokens){
    // Command format:
    // > tasks"
    // Look up all tasks for a given user
    var projectName = "";
    for(var i = 1; i < messageTokens.length; i++){
      projectName += messageTokens[i] + " ";
    }
    projectName = projectName.trim();
    if(!projectName) {
      rtm.sendMessage('Project Name required (e.g. tasks ProjectName)',message.channel);
      return;
    }

    dovico.getProjectIdByName(username, projectName)
    .then(function(assignment){
      console.log('got assignment by project name', assignment);
      dovico.getTasks(username, assignment.assignmentId).then(function(tasks){
        var taskText = "Your Tasks for " + projectName + ": ";
        tasks.Assignments.forEach(function(task) {
          taskText += "\r\n\t" + task.Name;
        });

        rtm.sendMessage(taskText, message.channel, function messageSent() {
          console.log("tasks listed" + taskText, tasks);
        });
      },
      function(error){
       rtm.sendMessage('Error listing tasks', message.channel, function messageSent() {
          console.log("Error listing tasks");
        });
      });
    },
    function(error) {
      rtm.sendMessage(':smile: Project not found, try running the command `projects` to see all projects', message.channel);
    });
  },
  'shame': function(rtm, message, username, messageTokens){

      store.everyone(function(error, keys) {

        if(error) {
          console.log("Error getting keys: " + error);
          return;
        } else {

          var channel = rtm.dataStore.getChannelByName("#general");
          console.log("CHANNEL: " + channel.id);

          var startDate = utilities.startOfWeek();
          var endDate = utilities.endOfWeek();

          keys.forEach(function(key) {


            console.log("Do we need to shame " + key + "?");

            dovico.getTotalHours(key, startDate, endDate).then(function(result) {

              console.log("result.totalHours: " + result.totalHours + ", result.submittedHours: " + result.submittedHours);

              if(result.submittedHours < 40) {

                     rtm.sendMessage('Shame :bell:! Shame :bell:! Shame :bell:!', channel.id, function messageSent() {
                        console.log("Shamed " + key );
                      });

                     rtm.sendMessage('@' + key + ' - Time < 40! Entered: ' + result.totalHours + ', Submitted: ' + result.submittedHours, channel.id, function messageSent() {
                        console.log(key + ' - Time < 40! Entered: ' + result.totalHours + ', Submitted: ' + result.submittedHours);
                      });

              } else {
                console.log("GOOD JOB " + key + "!");
              }


            })

          });
        }

      });
  }
};

module.exports = {'commands':commands, 'tokenCommands':tokenCommands};
