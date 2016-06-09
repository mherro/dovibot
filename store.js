//redis connection

var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('redis connected');
});

module.exports = {
	hasToken: function(userId, callback){
		client.exists(userId, function(err, reply) {
			if(err){
				callback(err);
			}
		    if (reply === 1) {
		        console.log('exists');
		        callback(err, true);
		    } else {
		        console.log('doesn\'t exist');
		        callback(err, false);
		    }
		});
	},
	getToken: function(userId, callback) {
		client.get(userId, callback);
	},
	saveToken: function(userId, token, callback){
		client.set(userId, token, callback);
	},
	deleteToken: function(userId, token, callback){
		client.del(userId, callback);
	}
};