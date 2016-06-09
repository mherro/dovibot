// module for dovico calls
var store = require("./store");

var setupToken = function(username, token, callback) {
	store.saveToken(username, token, callback);
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