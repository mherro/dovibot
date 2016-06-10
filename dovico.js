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
var getTree = function(username) {
	return new Promise(function(resolve, reject) {
		getProjects(username).then(
			function(projects){
				var _projects = [];
				var _emptyCompany = {CompanyName:'', projects:[]};
				_projects.push(_emptyCompany);
				projects.Assignments.forEach(function(assignment) {
	                var _projectName = assignment.Name.toLowerCase();
	              //  console.log('projectName: ' + _projectName + ', userProjectName: ' + projectName);
	                

	                if(assignment.AssignmentID[0] == 'C'){
	                	var project = {projects:[]};
		                project.CompanyName = assignment.Name;
		                project.CompanyId =   assignment.ItemID;
	    	            project.CompanyAssignmentId = assignment.AssignmentID;
	    	            _projects.push(project);
	    	        } else if(assignment.AssignmentID[0] == 'P') {
	    	        	_emptyCompany.projects.push({ 
	    	        		ProjectName : assignment.Name,
		                	ProjectId :   assignment.ItemID,
	    	                ProjectAssignmentId : assignment.AssignmentID});
	    	        } //else {
	    	        // 	project.TaskName = assignment.Name;
		            //     project.TaskId =   assignment.ItemID;
	    	        //     project.TaskAssignmentId = assignment.AssignmentID;
	    	        // }
	    	    });
	    	        var async = require('async');
	    	        async.each(_projects, function(company,callback){
	    	        	if(company.CompanyId){
		    	        	getTasks(username, company.CompanyAssignmentId ).then(function(result){
		    	        		console.log('got projects for company', company, result);
		    	        		result.Assignments.forEach(function(a){
		    	        			company.projects.push({ 
				    	        		ProjectName : a.Name,
					                	ProjectId :   a.ItemID,
				    	                ProjectAssignmentId : a.AssignmentID}
				    	             );
		    	        		});
		    	        		async.each(company.projects, function(p,task_callback){
		    	        			getTasks(username, p.ProjectAssignmentId).then(function(result2){
		    	        				result2.Assignments.forEach(function(task){
		    	        					if(!p.tasks){
		    	        						p.tasks = [];
		    	        					}
		    	        					p.tasks.push({
		    	        						TaskName : task.Name,
		    	        						TaskId : task.ItemID,
		    	        						TaskAssignmentId : task.AssignmentID
		    	        					});
		    	        				})
		    	        				task_callback();
		    	        			},function(err) {
				    	        		console.log('error loading tree', err);
				    	        		throw err;
				    	        	});


		    	        		}, function(err){
		    	        			if(err){
		    	        				console.log('error loading tree', err);
		    	        				throw err;
		    	        			}
		    	        			callback();
		    	        		})
		    	        		
		    	        	},function(err) {
		    	        		console.log('error loading tree', err);
		    	        		throw err;
		    	        	})
	    	        	}else {
	    	        		async.each(company.projects, function(p,task_callback){
		    	        			getTasks(username, p.ProjectAssignmentId).then(function(result2){
		    	        				result2.Assignments.forEach(function(task){
		    	        					if(!p.tasks){
		    	        						p.tasks = [];
		    	        					}
		    	        					p.tasks.push({
		    	        						TaskName : task.Name,
		    	        						TaskId : task.ItemID,
		    	        						TaskAssignmentId : task.AssignmentID
		    	        					});
		    	        				})
		    	        				task_callback();
		    	        			},function(err) {
				    	        		console.log('error loading tree', err);
				    	        		throw err;
				    	        	});


		    	        		}, function(err){
		    	        			if(err){
		    	        				console.log('error loading tree', err);
		    	        				throw err;
		    	        			}
		    	        			callback();
		    	        		})
	    	        	}

	    	        	
	    	        }, function(err){
	    	        	resolve(_projects);
	    	        });
	             //   getTasks()


	               // loadProjects(username, projects).then(function(projects){
	                //	return loadTasks(username, projects);
	                //});
	                // if(projectName.toLowerCase() === _projectName.toLowerCase()) {
	                //     console.log('Found it! ' + assignment.ItemID)
	                //     _assignment = {assignmentId:assignment.AssignmentID, projectId : assignment.ItemID};
	                //     resolve(_assignment);
	                // }
	        //    });
	           
			}
		,reject);
	});

}
var submitTime = function(username, startDate, endDate, callback) {

	getUserId(username, function(err, userId) {
		var formData = "";
	  	if(err) {
	    	callback(err, null);
	  	} else {
		  requestPost(username, 'https://api.dovico.com/TimeEntries/Employee/' + userId + '/Submit/?version=5&daterange=' + startDate + '%20' + endDate, formData).then(function(res) {
			    callback(null, res);
			  }, function(error) {
			    callback(error, null);
			  }
			);
	  	}
	});
}
var viewTimeForDelete = function(username, startDate, endDate) {
	return new Promise(function(resolve, reject) {
		getUserId(username, function(err, userId) {
			if(err) {
				reject(err);
			} else {
				var url = 'https://api.dovico.com/TimeEntries/?version=5&daterange=' + startDate + '%20' + endDate;
				console.log('viewing time for :', url);
				requestGet(username,url).then(function(result){
					var text = "";

					result.TimeEntries.forEach(function(entry) {
						if(entry.Employee.ID == userId  && (entry.Sheet.Status == 'N' || entry.Sheet.Status == 'R')){
							text += entry.ID + ' - ' + entry.Date + " - " +  entry.Project.Name + " - " 
							+ entry.Task.Name + " " + entry.TotalHours + "\n\r";
						}
					});

					resolve(text);
				},
				function(error){
					reject(error);
				});
			}
		});
	});
};
var statusEmoji = function(statusText){
	if(statusText == 'R') {  //rejected
		return ':x:';
	} else if(statusText == 'N'){ //unsubmitted
		return ':hourglass_flowing_sand:';
	} else if(statusText == 'A' || statusText == 'U') { //appproved
		return ':white_check_mark:'; //su
	}
}
var viewTime = function(username, startDate, endDate) {
	return new Promise(function(resolve, reject) {
		getUserId(username, function(err, userId) {
			if(err) {
				reject(err);
			} else {
				var url = 'https://api.dovico.com/TimeEntries/?version=5&daterange=' + startDate + '%20' + endDate;
				console.log('viewing time for :', url);
				requestGet(username,url).then(function(result){
					var text = "";
					var totalTime = 0;
					result.TimeEntries.forEach(function(entry) {
						if(entry.Employee.ID == userId){
              hoursWord = "hour"

              if (entry.TotalHours != "1") {
                hoursWord += "s";
              }

							text += statusEmoji(entry.Sheet.Status) + ' ' + entry.Date + " : " +  entry.Project.Name + " - " 
							+ entry.Task.Name + " : " + entry.TotalHours + " " + hoursWord + " : " + entry.Description + "\n\r";
							totalTime += parseFloat(entry.TotalHours);
						}
					});

					text += ' \n\r  Total Hours: ' + totalTime.toFixed(2);

					resolve(text);
				},
				function(error){
					reject(error);
				});
			}
		});
	});
};

var getTotalHours = function(username, startDate, endDate) {
	return new Promise(function(resolve, reject) {
		getUserId(username, function(err, userId) {
			if(err) {
				reject(err);
			} else {
				var url = 'https://api.dovico.com/TimeEntries/?version=5&daterange=' + startDate + '%20' + endDate;
				console.log('viewing time for :', url);
				requestGet(username,url).then(function(result){
					var totalHours = 0;
					var submittedHours = 0;
					result.TimeEntries.forEach(function(entry) {
						if(entry.Employee.ID == userId){
							var hours = parseFloat(entry.TotalHours);
							totalHours += hours;

							if(entry.Sheet.Status == 'A' || entry.Sheet.Status == 'U') {
								submittedHours += hours;
							}
						}
					});

					totalHours = Number(totalHours.toFixed(2));
					submittedHours = Number(submittedHours.toFixed(2));

					console.log('>>> totalHours: ' + totalHours + ", submittedHours: " + submittedHours);

					var result = {
						totalHours: totalHours,
						submittedHours: submittedHours
					}

					resolve(result);
				},
				function(error){
					reject(error);
				});
			}
		});
	});
};



var deleteTime = function(username, timeEntryId, callback) {
  requestDelete(username, 'https://api.dovico.com/TimeEntries/' + timeEntryId + '?version=5').then(function(res) {
   
    callback(null, res);
  }, function(error) {
    callback(error, null);
  });
}
var getProjectIdByName = function(username, projectName) {
	return new Promise(function(resolve, reject) {
		getProjects(username).then(
			function(projects){
				var _assignment = null;
				projects.Assignments.forEach(function(assignment) {
	                var _projectName = assignment.Name.toLowerCase();
	                console.log('projectName: ' + _projectName + ', userProjectName: ' + projectName);

	                if(projectName.toLowerCase() === _projectName.toLowerCase()) {
	                    console.log('Found it! ' + assignment.ItemID)
	                    _assignment = {assignmentId:assignment.AssignmentID, projectId : assignment.ItemID};
	                    resolve(_assignment);
	                }
	            });
	            if(!_assignment){
	            	reject('Project Name not found');
	            }
			}
		,reject);
	});
}


var getProjects = function(username) {
	return requestGet(username,'https://api.dovico.com/Assignments/?version=5');
}
	
var clientid = process.env.DOVICO_CLIENT_ID;

var getTasks = function(username, projectID) {
	return requestGet(username, 'https://api.dovico.com/Assignments/' + projectID + '?version=5')
};

var openDovico = function(callback) {
  callback('https://login.dovico.com')
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

					if(!error) {
						error = "Status code: " + response.statusCode;
					}

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


			var requestBody = "[" + JSON.stringify(formData) + "]"; 

			var options = {
			  url: url,
			  headers: {
			    'Authorization' : 'WRAP access_token=\"client=' + clientid + '&user_token=' + token + '\"',
			    'Accept' : 'application/json',
			    'Content-Type' : 'application/json'
			  },
        		body: requestBody
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
						error = JSON.parse(body).Description;
					}

					reject(error);
				}
			});
		});
	});
}


var requestDelete = function(username, url) {
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
			  },
			  body: "[]"

			};

			console.log('performing delete', options);

			request.delete(options, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					//var info = JSON.parse(body);

					console.log("request response", body);

					resolve(body);
				} else {
					console.log('delete request error:', error, response.statusCode, body);
					if(!error) {
						error = "Status code: " + response.statusCode;
					}
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
	'viewTime' : viewTime,
	'getTotalHours' : getTotalHours,
	'getUserId' : getUserId,
	'enterTime' : enterTime,
	'submitTime' : submitTime,
	'deleteTime' : deleteTime,
	'openDovico' : openDovico,
	'viewTimeForDelete' : viewTimeForDelete,
	'getProjectIdByName' : getProjectIdByName,
	'getTree': getTree
};
