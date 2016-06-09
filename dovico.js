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

var getUserId = function(username, callback) {
  requestGet(username, 'https://api.dovico.com/Employees/Me/?version=5').then(function(res) {
    callback(null, res.Employees[0].ID);
  }, function(error) {
    callback(error, null);
  });
}

var enterTime = function(username, projectId, taskId, date, hours, description, callback) {


  getUserId(username, function(err, userId) {

  	if(err) {
    	callback(err, null);
  	} else {


	  var formData = {
	    "ProjectID": projectId,
	    "TaskID": taskId,
	    "EmployeeID": userId,
	    "Date": date,
	    "TotalHours": hours,
	    "Description": description
	  };

	  requestPost(username, 'https://api.dovico.com/TimeEntries/?version=5', formData).then(function(res) {
		    callback(null, res);
		  }, function(error) {
		    callback(error, null);
		  }
		);


  	}

  });

}

var submitTime = function(username, startDate, endDate, callback) {

	getUserId(username, function(err, userId) {

	  var formData = {
	    "daterange": startDate + '%20' + endDate,
	  };


  	if(err) {
    	callback(err, null);
  	} else {
	  requestPost(username, 'https://api.dovico.com/TimeEntries/Employee/' + userId + '/Submit/?version=5', formData).then(function(res) {
		    callback(null, res);
		  }, function(error) {
		    callback(error, null);
		  }
		);
  	}

  });


}

var viewTime = function(username, startDate, endDate) {
	return new Promise(function(resolve, reject) {
		var url = 'https://api.dovico.com/TimeEntries/?version=5&daterange=' + startDate + '%20' + endDate;
		console.log('viewing time for :', url);
		requestGet(username,url).then(function(result){
			var text = "";

			result.TimeEntries.forEach(function(entry) {
				text += entry.Date + " - " +  entry.Project.Name + " - " 
					+ entry.Task.Name + " " + entry.TotalHours + "\n\r";
			});

			resolve(text);
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


var requestPost = function(username, url, formData) {
	return new Promise(function(resolve, reject){
		store.getToken(username, function(err, token){
			if(err){
				console.log('error getting token', err);

				reject(err);
			}

			console.log('got user token for username: ' + username);

			var options = {
			  url: url,
			  headers: {
			    'Authorization' : 'WRAP access_token=\"client=' + clientid + '&user_token=' + token + '\"',
			    'Accept' : 'application/json',
			    'Content-Type' : 'application/json'
			  },
        		formData: formData
			};

			console.log('post.options',options);

			request.post(options, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var info = JSON.parse(body);

					console.log("Upload successful! request response: ", body);

					resolve(info);
				} else {
					console.log('request error: ', error, response.statusCode);

					if(!error) {
						error = "Status code: " + response.statusCode;
					}

					reject(error);
				}
			});
		});
	});
}



module.exports = {
	'setupToken' : setupToken,
	'getProjects' : getProjects,
	'getTasks' : getTasks,
	'viewTime' : viewTime,
	'getUserId' : getUserId,
  'enterTime' : enterTime,
  'submitTime' : submitTime,
};
