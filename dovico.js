// module for dovico calls
var store = require("./store");

var Promise = require('bluebird');



var setupToken = function(){ 
	return new Promise(function(resolve, reject) {
		store.saveToken(username, token, function(error,data){
			if(error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});	
}

var enterTime = function() {


}

var submitTime = function() {


}

var viewTime = function() {

}



module.exports = {
	'setupToken' : setupToken
};