var mime = require('mime');
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var io = require('socket.io');

var app = http.createServer(function (req, res) {
	var urlPath = url.parse(req.url).pathname;
	if(urlPath == '/'){
		urlPath = "index.html";
	}
	var filename = process.cwd();
	filename = path.join(filename, urlPath);
	console.log("Serving "+filename);
	fs.readFile(filename, "UTF-8", function (err,data) {
		if (err) {
			res.writeHead(404, {"Content-Type":"text/plain"});
			res.end("File not found");
		} else {
			res.writeHead(200, {"Content-Type": mime.lookup(filename)});
			var filestream = fs.createReadStream(filename);
			filestream.pipe(res);
		}
	});
}).listen(9502, "0.0.0.0");

function Timer() {
	this.q = {};
}
Timer.prototype.set = function(fn, delay) {
	var that = this;
	var id = setTimeout(function() {
		delete that.q[id];
		fn();
	}, delay);
	this.q[id] = 1;
};
Timer.prototype.clear = function() {
	for (var id in this.q)
		clearTimeout(id);
};

function startGame(tm, player, enemy) {
	var ncities = 0;
	var missilesRemaining = 0;
	function newRound() {
		++ncities;
		missilesRemaining = ncities * 3;
		player.emit("round", {cities: ncities, missiles: missilesRemaining});
		enemy.emit("round", {cities: ncities, missiles: missilesRemaining});
	}
	player.on("shoot", function(data) {
	});
}

var websocket = io.listen(app);
var q = [];
var socketQueue = {};
var gameTimers = {};
websocket.sockets.on("connection", function(socket){
	console.log("Client connect", socket);

	socket.on("init", function(data) {
		q.push(socket);
		socketQueue[socket] = [q];
		if (q.length == 2) {
			var tm = new Timer;
			gameTimers[socket] = tm;
			startGame(tm, q[0], q[1]);
			q = [];
		}
		else socket.emit("waiting");
	});

	socket.on("disconnect", function() {
		que = socketQueue[socket];
		if (!que) return;
		delete socketQueue[socket];
		var tm = gameTimers[socket];
		if (tm) tm.clear();
		delete gameTimers[socket];
		if (que.length == 1)
			q = [];
		else {
			try {
				for(var i = 0; i < que.length; i++){
					if(que[i] != socket)
						que[i].emit("disconnect");
				}
			} catch(e) {}
		}
	});
});

/*
function startGame(pc, roomName){
	var players = queue[pc][roomName];
	queue[pc][roomName] = [];
	var inputs = [];
	var inputMap = {};
	for(var i = 0; i<players.length; i++){
		var socket = players[i];
		var input = new Input();
		(function(inp, sock){
			sock.on("input", function(data){
				inp.left = data.left || false;
				inp.up = data.up || false;
				inp.right = data.right || false;
				inp.down = data.down || false;
				inp.bomb = data.bomb || false;
			});
		})(input, socket);
		inputs.push(input);
		socket.emit("controls", {controls: constants.PLAYER_CONTROLS[i]});
	}
	var mapType = map.Maps[0];
	var gameMap = new map.Map(mapType[0], mapType[1]);
	var theGame = new game.Game(inputs, gameMap, players);
	console.log("Game setup");
	theGame.start();
}
*/
