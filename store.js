//redis connection

var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('redis connected');
});


module.exports = {
	hasToken: function(userId){},
	getToken: function(userId){},
	saveToken: function(userId){}
};