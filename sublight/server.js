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
	this.running = true;
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
	this.running = false;
	for (var id in this.q)
		clearTimeout(id);
};

function delta(from, to, speed) {
	var dx = to.x - from.x;
	var dy = to.y - from.y;
	var scale = 1/Math.sqrt(dx*dx + dy*dy) * speed;
	dx *= scale;
	dy *= scale;
	return {dx:dx, dy:dy};
}

function startGame(tm, player, enemy) {
	var playing = false;
	var whichRound = 0;
	var HEIGHT = 600, WIDTH = 800;
	var CITY_HITBOX = 30;
	var EXPL_RAD = 80;
	var activePlayerMissiles, activeEnemyMissiles;
	var speed;
	function emit() {
		player.emit.apply(player, arguments);
		enemy.emit.apply(enemy, arguments);
	}

	function round() {
		++whichRound;
		playing = true;
		var ncities = whichRound;
		var cities = [], cityInds = [];
		for (var i = 0; i < ncities; ++i) {
			cities.push({x: (i+0.5)/ncities * WIDTH, y: HEIGHT - 50});
			cityInds.push(i);
		}
		speed = Math.pow(1.25, whichRound-1) * HEIGHT / 5 / (1000 / 16);
		var missilesRemaining = whichRound * 3;
		activePlayerMissiles = [];
		activeEnemyMissiles = [];
		emit("round", {cities: cities, missiles: missilesRemaining});

		function loop() {
			for (var i = 0; i < activePlayerMissiles.length; ++i) {
				var m = activePlayerMissiles[i];
				m.pos.x += m.delta.dx;
				m.pos.y += m.delta.dy;
				var rem = {x: m.target.x - m.pos.x, y: m.target.y - m.pos.y};
				if (rem.x*m.delta.dx + rem.y*m.delta.dy < 0) {
					emit("playerMissileExplode", m.pos);
					for (var j = 0; j < activeEnemyMissiles.length; ++j) {
						var m2 = activeEnemyMissiles[j];
						var dx = m2.pos.x - m.pos.x;
						var dy = m2.pos.y - m.pos.y;
						var d = Math.sqrt(dx*dx + dy*dy);
						if (d < EXPL_RAD) {
							activeEnemyMissiles.splice(j, 1);
							--j;
							--missilesRemaining;
						}
					}
					activePlayerMissiles.splice(i, 1);
					--i;
				}
			}

			for (var i = 0; i < activeEnemyMissiles.length; ++i) {
				var m = activeEnemyMissiles[i];
				m.pos.x += m.delta.dx;
				m.pos.y += m.delta.dy;
				if (m.pos.x < -100 || m.pos.x > WIDTH + 100 || m.pos.y > HEIGHT + 30 || m.pos.y < -30) {
					activeEnemyMissiles.splice(i, 1);
					--i;
					--missilesRemaining;
					continue;
				}

				for (var j = 0; j < cities.length; ++j) {
					var c = cities[j];
					var dx = c.x - m.pos.x;
					var dy = c.y - m.pos.y;
					var d = Math.sqrt(dx*dx + dy*dy);
					if (d < CITY_HITBOX) {
						cities.splice(j, 1);
						var ind = cityInds[j];
						cityInds.splice(j, 1);
						emit("cityExplode", {index: ind, index2: j, pos: c});
						--j;
					}
				}
			}

			emit("frame", [activePlayerMissiles, activeEnemyMissiles, cities]);

			if (!cities.length) {
				emit("gameover");
				playing = false;
				return;
			}

			if (!missilesRemaining) {
				emit("wonlevel");
				playing = false;
				tm.set(round, 1500);
				return;
			}

			tm.set(loop, 16);
		}
		tm.set(loop, 16);
	}
	player.on("shoot", function(data) {
		if (!playing) return;
		var from = data.from;
		var to = data.to;
		activePlayerMissiles.push({pos: from, delta: delta(from, to, speed), target: to});
	});
	enemy.on("shoot", function(data) {
		if (!playing) return;
		var from = data.from;
		var to = data.to;
		if (from.y == to.y) to.y = from.y + 1;
		var de = delta(from, to, speed);
		// from.y + (to.y - from.y) * M = 0
		var M = -from.y / (to.y - from.y);
		var x = from.x + (to.x - from.x) * M;
		activeEnemyMissiles.push({pos: {x: x, y: 0}, delta: de});
	});
	round();
}

var websocket = io.listen(app);
var q = [];
var socketQueue = {};
var gameTimers = {};
websocket.sockets.on("connection", function(socket){
	console.log("Client connect", socket.id + "");

	socket.on("init", function(data) {
		q.push(socket);
		socketQueue[socket.id] = q;
		if (q.length == 2) {
			var tm = new Timer;
			gameTimers[socket.id] = tm;
			startGame(tm, q[0], q[1]);
			q = [];
		}
		else socket.emit("waiting");
	});

	socket.on("disconnect", function() {
		que = socketQueue[socket.id];
		if (!que) return;
		delete socketQueue[socket.id];
		var tm = gameTimers[socket.id];
		if (tm) tm.clear();
		delete gameTimers[socket.id];
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
