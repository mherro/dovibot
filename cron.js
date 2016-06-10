var cron = require('node-cron');
var store = require('./store');
var dovico = require('./dovico');
var utilities = require('./utilities');

var init = function(rtm) {

	console.log("Init cron");

	cron.schedule('52 0 * * Friday', function(){
  		console.log('***********************');
  		console.log('** running cron task **');
  		console.log('***********************');


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

  					dovico.getTotalHours(key, startDate, endDate).then(function(totalHours, submittedHours) {

  						if(submittedHours < 40) {

				             rtm.sendMessage('Shame :bell:! Shame :bell:! Shame :bell:!', channel.id, function messageSent() {
				                console.log("Error listing time", error );
				              });

				             rtm.sendMessage(key + ' - Time < 40! Entered: ' + totalHours + ', Submitted: ' + submittedHours, channel.id, function messageSent() {
				                console.log("Error listing time", error );
				              });

  						}

  					})

  				});
  			}

  		});



	});


}


module.exports = {
	'init' : init,

}