var socket = io.connect("http://"+document.domain+":9502")
var ctx = canvas.getContext("2d");
var width = 800;
var height = 600;
var started = false;

var state = null;
var activeBase = -1;
var gameover = false;
var won = false;

socket.on("connect", function(){
    started = false;
    defender = false;
    socket.emit("init", {});
});

var defender = false;

var sendLeft = 0;

socket.on("waiting", function(){
    defender = true;
    drawStatus("Waiting for opponent...");
    drawBackground();
    console.log("got waiting");
});


socket.on("round", function(state){
    if(!started){
        showControls(defender);
        if(defender){
            DefenderInput();
        } else {
            AttackerInput();
        }
        window.requestAnimationFrame(repaint);
        started = true;
    }
    sendLeft = state.missiles;
});

socket.on("frame", function(cur){
    state = cur;
});

socket.on("cityExplode", function(cur){
    makeExplosion(cur.pos);
});

socket.on("playerMissileExplode", function(cur){
    makeExplosion(cur);
});

var explosions = [];

function makeExplosion(pos){
    console.log(pos);
    explosions.push([pos, 60]);
}

function AttackerInput() {
    var down;
    $("body").mousedown(function(e){
        down = getEventPos(e);
    });
    $("body").mouseup(function(e){
        if(sendLeft == 0) return;
        sendLeft--;
        var up = getEventPos(e);
        socket.emit("shoot", {from: down, to: up});
    });
}

socket.on("gameover", function(){
    gameover = true;
    if(defender){
        won = false;
    } else {
        won = true;
    }
});

function getEventPos(e){
    var x = e.pageX;
    var y = e.pageY;
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    return {x: x, y: y};
}

function DefenderInput() {
    activeBase = 1;
    $("body").keydown(function(e){
        if(e.which == 65){
            activeBase = 0;
        }
        if(e.which == 83){
            activeBase = 1;
        }
        if(e.which == 68){
            activeBase = 2;
        }
    });
    $("canvas").mousedown(function(e){
        if(sendLeft == 0) return;
        sendLeft--;
        var pos = getEventPos(e);
        if(activeBase == 0) socket.emit("shoot", {from: {x: 130, y:545}, to:pos});
        if(activeBase == 1) socket.emit("shoot", {from: {x: 380, y:545}, to:pos});
        if(activeBase == 2) socket.emit("shoot", {from: {x: 630, y:545}, to:pos});
    });
}

function repaint(){
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawInfo();
    drawGame();
    window.requestAnimationFrame(repaint);
}


var bgImage = new Image();
bgImage.src = "bakgrund.png";

function drawBackground(){
    ctx.drawImage(bgImage, 0, 0);
}

function drawInfo(){
    ctx.fillStyle = "#0a0000";
    ctx.fillText("Missiles left: " + sendLeft, 10, 580);
    if(gameover){
        drawStatus(won ? "You won!" : "You lost :(");
    }
}

function drawStatus(str){
    ctx.fillText(str, width/2 - 50, height/2);
}

function drawHouses(){
    var houses = state[2];
    for(house of houses){
        drawHouse(house.x, house.y);
    }
}

var houseImage = new Image();
houseImage.src = "hus.png";

function drawHouse(topx, topy){
    ctx.drawImage(houseImage, topx - 32, topy - 32);
}

function drawMissiles(){
    var defMissiles = state[0];
    var enemyMissiles = state[1];
    for(mis of defMissiles){
        drawMissile(mis, "defender");
    }
    for(mis of enemyMissiles){
        drawMissile(mis, "attacker");
    }
}

var baseImage = new Image();
baseImage.src = "bas.png";

var activeBaseImage = new Image();
activeBaseImage.src = "bas_aktiv.png";

function drawBase(x, y, active){
    if(!active) ctx.drawImage(baseImage, x, y);
    else ctx.drawImage(activeBaseImage, x, y);
}

function drawBases(){
    drawBase(100, 572, activeBase == 0);
    drawBase(350, 572, activeBase == 1);
    drawBase(600, 572, activeBase == 2);
}

var niceMissile = new Image();
niceMissile.src = "god.png";

var evilMissile = new Image();
evilMissile.src = "ond.png";

function drawMissile(mis, type){
    var pos = mis.pos;
    var delta = mis.delta;
    var angle = Math.atan2(delta.dy, delta.dx);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.translate(-42, 0);
    ctx.fillRect(0, 0, 10, 10);
    ctx.scale(0.4, 0.4);
    if(type == "defender") ctx.drawImage(niceMissile, 0, 0);
    else ctx.drawImage(evilMissile, 0, 0);
    ctx.restore();
}

var explosionImage = new Image();
explosionImage.src = "bang.png";

function drawExplosions(){
    var newExplosion = [];
    for(explosion of explosions){
        ctx.drawImage(explosionImage, explosion[0].x - 32, explosion[0].y - 32);
        explosion[1] -= 1;
        if(explosion[1]) newExplosion.push(explosion);
    }
    explosions = newExplosion;
}

function drawGame(){
    if(state != null && !gameover){
        drawBases();
        drawHouses();
        drawMissiles();
        drawExplosions();
    }
}

function showControls(isDefender){
    $("#defender-"+isDefender).show();
}
