var cron = require('node-cron');
var store = require('./store');
var dovico = require('./dovico');

var init = function() {

	console.log("Init cron");

	cron.schedule('59 23 * * Thursday', function(){
  		console.log('***********************');
  		console.log('** running cron task **');
  		console.log('***********************');


  		store.everyone(function(error, keys) {

  			if(error) {
  				console.log("Error getting keys: " + error);
  				return;
  			} else {


            	var startDate = utilities.startOfWeek();
            	var endDate = utilities.endOfWeek();

  				keys.forEach(function(key) {

  					var totalTime = 0;


  					dovico.viewTimeJSON(key, startDate, endDate).then(function(time) {

  						time.TimeEntries.forEach(function(timeEntry) {

  							totalTime += parseFloat(timeEntry.TotalTime);

  						});


  					})



  				});

  			}


  		});



	});


}


module.exports = {
	'init' : init,

}