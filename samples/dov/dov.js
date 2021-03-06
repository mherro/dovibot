var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;

// var token = process.env.SLACK_API_TOKEN || '';

var token = 'GET TOKEN FROM ENV VARIABLE';

var rtm = new RtmClient(token, {logLevel: 'debug', dataStore: new MemoryDataStore({}) });


var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

rtm.on(RTM_EVENTS.HELLO, function (hello) {

	console.log("HELLO!");

	// console.log('ID: ' + rtm.ID);
	// console.log('Team: ' + rtm.team);

});



rtm.on(RTM_EVENTS.MESSAGE, function (message) {
  // Listens to all `message` events from the team
  console.log('SOMEONE IS TALKING');
  
  console.log('My ID: ' + rtm.activeUserId);
  console.log('From ID: ' + message.user);


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
    rtm.sendMessage('Hello, how are you?', message.channel, function messageSent() {
      console.log('NICE DM SENT');
	});
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



