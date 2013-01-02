
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , spawn = require('child_process').spawn;

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.get ('/stream/:filename', function (req,res) {
	var fn = '/media/media/videos_h265/' +req.params.filename + '.m4v';
	console.log ('stream: filename ' + fn);
	res.sendfile (fn);
});

app.get ('/tv', function (req,res) {
	var conv = spawn('cat' , ['/dev/dvb/adapter0/dvr0']);
	res.writeHeader (206, { 'Connection':'keep-alive', 'Content-Type':'video/ogg'});
	conv.stdout.on('data', function (data) {
		//console.log ('got data');
		res.write (data);
	});
	conv.stderr.on('data', function (data) {
		console.log ('got error data  : ' + data);
	});
	conv.on ('exit', function (code, signal) {
		console.log ('finish data : ' + code);
		res.end();
	});

});

app.get ('/tvfile', function (req,res) {
	
	fs.open('/dev/dvb/adapter0/dvr0', 'r',  function (err,fd) {
		readStream = fs.createReadStream(path, { flags: 'r', fd: fd, bufferSize: 128* 1024});
	        readStream.on('open', function () {
			console.log ('writing headers');
			res.writeHeader (206, { 'Connection':'Keep-Alive', 'Content-Type':'video/mpeg'});
		 });  

		readStream.on('data', function (data) {
			console.log ('got data');
			res.write (data);
		});
		readStream.on('error', function (err) {
			console.log ('got error data  : ' + err);
		});
		readStream.on('end', function (data) {
			console.log ('got end   : ' + data);
			res.end();
		});
	});

});

app.get ('/conv', function (req, res) {
	// var conv = spawn('avconv' , ['-i', '/dev/dvb/adapter0/dvr0', '-c:v', 'libx264', '-c:a', 'libvo_aacenc', '-f', 'avi', '-']);
	var conv = spawn('avconv' , ['-i', '/dev/dvb/adapter0/dvr0', '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', '-f', 'avi', '-']);
	res.writeHeader (206, { 'Connection':'keep-alive', 'Content-Type':'video/ogg'});
	conv.stdout.on('data', function (data) {
		//console.log ('got data');
		res.write (data);
	});
	conv.stderr.on('data', function (data) {
		console.log ('got error data  : ' + data);
	});
	conv.on ('exit', function (code, signal) {
		console.log ('finish data : ' + code);
		res.end();
	});
});
