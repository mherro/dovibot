// module for dovico calls
var store = require("./store");

var Promise = require('bluebird');
var request = require('request');


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

var getProjects = function(username) {
	return new Promise(function(resolve, reject){
		store.getToken(username, function(err, token){
			if(err){
				console.log('error getting token', err);
				reject(err);
			}
			console.log('got user token for username:' + username);
			var options = {
			  url: 'https://api.dovico.com/Assignments/?version=5',
			  headers: {
			    'Authorization' : 'WRAP access_token=\"client=47a048bbaa884c56a7feef9483c171e3.29671&user_token=95a8175ed6d941dab8f21c887a7d8102.29671\"',

			    //"'WRAP access_token' :'client=47a048bbaa884c56a7feef9483c171e3.29671&user_token='" + token + "'",
			    'Accept' :'application/json'
			  }
			};
			request.get(options, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var info = JSON.parse(body);
					console.log("request response", body);
					resolve(info);
				} else {
					console.log('request error:', error, response.statusCode);
					reject(error);
				}
			});
		});
	});

}



module.exports = {
	'setupToken' : setupToken,
	'getProjects' : getProjects
};