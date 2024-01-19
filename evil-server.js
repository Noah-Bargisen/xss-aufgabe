var express = require('express');
var app = express();

app.use(function(req, res, next) {
	// Allows CORS requests:
	res.header('Access-Control-Allow-Origin', '*');
	next();
});

app.get('/cookie', function(req, res, next) {
	console.log('GET /cookie');
	console.log(req.query.data);
	res.send('Danke!');
});

app.get('/keys', function(req, res, next) {
	console.log('GET /keys');
	console.log(req.query.data);
	res.send('Ich werde versuchen, mich daran zu erinnern...');
});

app.listen(3001, function() {
	console.log('"Evil" server listening at localhost:3001');
});
