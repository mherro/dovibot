

var store = require('./store.js');

store.hasToken('blahblah', function(error, result) { console.log('hasToken', error, result)});

store.saveToken('blahblah','pizza pizza', function(error, result) { console.log('saveToken', error, result)});


store.hasToken('blahblah', function(error, result) { console.log('hasToken2', error, result)});

store.getToken('blahblah', function(error, result) { console.log('getToken', error, result)});

store.deleteToken('blahblah', function(error, result) { console.log('getToken', error, result)});
