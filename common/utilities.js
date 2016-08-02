var moment = require('moment');


module.exports = {
	startOfWeek :  function(){
		return moment().startOf('isoweek').format('YYYY-MM-DD')
	},
	endOfWeek : function(){
		return moment().endOf('week').add(1,'days').format('YYYY-MM-DD');
	},
	today : function(){
		return moment().format('YYYY-MM-DD');
	},
	yesterday : function() {
		return moment().add(-1,'days').format('YYYY-MM-DD');
	}
}