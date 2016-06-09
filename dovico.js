// module for dovico calls
var store = require("./store");

var Promise = require('bluebird');
var request = require('request');


var setupToken = function(username, token){ 
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
	return new Promise(function(resolve, reject) {
		requestGet(username,'https://api.dovico.com/TimeEntries/?version=5&daterange=2016-06-05%202016-06-11').then(function(result){
			resolve(result);
		},
		function(error){
			reject(error);
		});
	});
};


var getProjects = function(username) {
	return requestGet(username,'https://api.dovico.com/Assignments/?version=5');
}
	
var clientid = process.env.DOVICO_CLIENT_ID;

var getTasks = function(username, projectID) {
	return requestGet(username, 'https://api.dovico.com/Assignments/P' + projectID + '?version=5')
};

var requestGet = function(username,url) {
	return new Promise(function(resolve, reject) {
		store.getToken(username, function(err, token){
			if(err){
				console.log('error getting token', err);
				reject(err);
			}
			console.log('got user token for username:' + username);
			var options = {
			  url: url,
			  headers: {
			    'Authorization' : 'WRAP access_token=\"client=' + clientid + '&user_token=' + token + '\"',
			    'Accept' :'application/json'
			  }
			};
			console.log('get.options',options);
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
};



module.exports = {
	'setupToken' : setupToken,
	'getProjects' : getProjects,
	'getTasks' : getTasks,
	'viewTime' : viewTime
};