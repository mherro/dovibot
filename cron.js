var cron = require('node-cron');

var init = function() {

	console.log("Init cron");

	cron.schedule('* 21 23 * *', function(){
  		console.log('**********************');
  		console.log('*********** running a task every minute');
  		console.log('**********************');
	});


}


module.exports = {
	'init' : init,

}