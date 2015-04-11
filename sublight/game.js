var socket = io.connect("http://"+document.domain+":9502")
var ctx = canvas.getContext("2d");
var width = 800;
var height = 600;

socket.on("connect", function(){
    socket.emit("init", {});
});

var defender = false;

socket.on("waiting", function(){
    defender = true;
    drawStatus("Waiting for opponent...");
    drawBackground();
});

socket.on("round", function(){
    showControls(defender);
});


function DefenderInput(socket) {
    this.socket = socket;

}
DefenderInput.prototype.createListeners = function(){
    var input = this;
    $("canvas").keydown(function(e){
        console.log(e.which);
    });
}

function drawBackground(){
    ctx.stroke = "#000000";
    ctx.strokeRect(0, 0, width, height);
}

function drawStatus(str){
    ctx.fillText(str, width/2 - 50, height/2);
}

function showControls(isDefender){
    console.log("#defeinder-"+isDefender);
    $("#defender-"+isDefender).show();
}
