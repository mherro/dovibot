var moment = require('moment');


module.exports = {
	startOfWeek :  function(){
		return moment().startOf('isoweek').format('YYYY-MM-DD')
	},
	endOfWeek : function(){
		return moment().endOf('week').format('YYYY-MM-DD');
	},
	today : function(){
		return moment().format('YYYY-MM-DD');
	}

}