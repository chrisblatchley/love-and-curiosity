/*****************************************
 * File: game.js
 * Authors: Chris Blatchley, Thad Bond
 * 
 * * * * * * * * * * * * * * * * * * * * *
 * Love and Curiosity is a Javascript and
 * Canvas game developed for the SP2013
 * Gordon College Computer Science Club
 * Programming Competition. We hope you
 * enjoy playing Love and Curiosity.
 *****************************************/

//
// Create Document Variables
var canvas;
var ctx;


//
// Create Global Game Variables
var player;
var spriteQueue = [];
var eventQueue = []
var keysDown = new Array(222);	// A Boolean array to show keys down. 222 is Max keycode

//*****************************************************************************
//*****************************************************************************

//
// MAIN START POINT: on document.load
$(function () {
	initGame();

	$("#message").html("Loaded up!");
});

//
// Load Image Convenience Function
function loadImage(imageURI) {
	var img = new Image();
	img.src = imageURI;
	return img;
}

//
// Game Functions
//

//
// Initialization Function
function initGame() {
	// Set canvas and context variables
	canvas = $("#game")[0];
	ctx = canvas.getContext("2d");

	// Set canvas proper width and height
	canvas.width = $("#game").width();
	canvas.height = $("#game").height();

	// Setup player sprite
	player = new Sprite();
	player.image = loadImage("media/car.png");
	player.x = canvas.width / 2 - player.image.width / 2;
	player.y = canvas.height / 2 - player.image.height / 2;
	player.theta = 0;
	player.forwardSpeed = 4;
	player.rotateSpeed = 0.12;

	$(document).keydown(function (e) { eventQueue.push(e); });
	$(document).keyup(function (e) { eventQueue.push(e) });

	setInterval(gameLoop, 15);
}

function gameLoop() {
	//Handle Events
	if(eventQueue.length > 0) {
		// Handle Events
		var e = eventQueue.shift();

		if(e.type == "keydown") {
			keysDown[e.which] = true;
		}
		else if(e.type == "keyup") {
			keysDown[e.which] = false;
		}
	}

	// Update Game State
	updateGame();

	// Draw the screen
	drawScreen();
}

//
// Update the automatic game state
function updateGame() {
	if(keysDown[37]) { // Left Arrow
		player.theta -= player.rotateSpeed;
	}
	if(keysDown[38]) { // Up Arrow
		var dx = Math.sin(player.theta) * player.forwardSpeed;
		var dy = Math.cos(player.theta) * player.forwardSpeed;
		player.x += dx;
		player.y -= dy;
	}
	if(keysDown[39]) { // Right Arrow
		player.theta += player.rotateSpeed;
	}
	if(keysDown[40]) { // Down Arrow
		var dx = Math.sin(player.theta) * player.forwardSpeed;
		var dy = Math.cos(player.theta) * player.forwardSpeed;
		player.x -= dx;
		player.y += dy;
	}
	if(keysDown[32]) { // Space
		$("#message").html("Shoot!");
	} else {
		$("#message").html("");
	}
}

//
// Draw the game state to the context
function drawScreen() {
	// Clear Drawing Canvas
	ctx.clearRect(0,0, canvas.width, canvas.height);

	// Draw Player Art
	ctx.save();
	ctx.translate( player.x - player.image.width / 2, player.y - player.image.height / 2 );
	ctx.rotate( player.theta );
	ctx.translate( -(player.image.width/2), -(player.image.height/2) );
	ctx.drawImage( player.image, 0, 0 );
	ctx.restore();
	
}

//*****************************************************************************
//*****************************************************************************

//
// Sprite Basic Object
function Sprite () {
	this.x = 0;
	this.y = 0;
	this.image = null;
}