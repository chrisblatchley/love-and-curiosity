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
var laserQueue = [];
var eventQueue = []
var keysDown = new Array(222);	// A Boolean array to show which keys are pressed

//
// Game Constants
var Direction = { Up:0, Down:1, Left:2, Right: 3 };

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
	player.rotateSpeed = 0.06;
	player.shotCounter = 0;

	// Create some random NPCs
	for(var i = 0; i < 6; i++) {
		spawnNPC();
	}

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

	// Update Laser Positions
	for (var i = laserQueue.length - 1; i >= 0; i--) {
		var l = laserQueue[i];

		// Calculate next laser location
		var dx = Math.sin(l.theta) * l.speed;
	   	var dy = Math.cos(l.theta) * l.speed;

	   	// Check for collisions with nearby enemies
	   	for (var j = spriteQueue.length - 1; j >= 0; j--) {
	   		if( l.x > spriteQueue[j].x - 10 && l.x < spriteQueue[j].x + spriteQueue[j].image.width + 10 &&
	   			l.y > spriteQueue[j].y - 10 && l.y < spriteQueue[j].y + spriteQueue[j].image.height + 10 )
	   		{
	   			// Find an exact calculation of where the collision happened
	   			for (var i = 1; i <= l.speed; i++) {
	   				var x = Math.sin(l.theta) * i;
	   				var y = Math.cos(l.theta) * i;
	   				if( l.x + x > spriteQueue[j].x && l.x + x < spriteQueue[j].x + spriteQueue[j].image.width &&
	   					l.y - y > spriteQueue[j].y && l.y - y < spriteQueue[j].y + spriteQueue[j].image.height)
	   				{
	   					// Create new hit and add it to sprite queue
	   					// var hit = new Sprite(l.x + x, l.y - y, new Image());
	   					// spriteQueue.push(hit);
	   					console.log("HIT!!");
	   					//laserQueue[i] = null;
	   					break;
	   				}
	   			};
	   		}
	   	};

		l.x += dx;
	   	l.y -= dy;

	   	// Remove laser if out of bounds
	   	if(l.x < 0 || l.x > canvas.width || l.y < 0 || l.y > canvas.width) {
	   		laserQueue[i] = null;
	   	}
	};

	// handle Key Triggers
	if(keysDown[65]) { // Left Arrow
		movePlayer(Direction.Left);
	}
	if(keysDown[87]) { // Up Arrow
		movePlayer(Direction.Up);
	}
	if(keysDown[68]) { // Right Arrow
		movePlayer(Direction.Right);
	}
	if(keysDown[83]) { // Down Arrow
		movePlayer(Direction.Down);
	}
	if(keysDown[32]) {
		shoot(player.x - player.image.width / 2,
			  player.y - player.image.height / 2,
			  player.theta);
	}

	// Remove old lasers
	var newQueue = [];
	for (var i = laserQueue.length - 1; i >= 0; i--) {
		if(laserQueue[i] != null) {
			newQueue.push(laserQueue[i]);
		}
	};
	laserQueue = newQueue;
	if(player.shotCounter > 0) player.shotCounter--;	// Decrease shot counter
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

	// Draw Enemy Sprites
	ctx.fillStyle = "#fff";
	for (var i = spriteQueue.length - 1; i >= 0; i--) {
		var e = spriteQueue[i];
		ctx.drawImage(e.image, e.x, e.y);
	};

	// Draw Lasers
	ctx.strokeStyle = "red";
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (var i = laserQueue.length - 1; i >= 0; i--) {
		var l = laserQueue[i];
		ctx.moveTo(l.x, l.y);
		ctx.lineTo(l.x - Math.sin(l.theta) * l.size,
				   l.y + Math.cos(l.theta) * l.size);
	};
	ctx.closePath();
	ctx.stroke();
}

//*****************************************************************************
//*****************************************************************************

// Game Actions

//
// Move Player
function movePlayer(direction) {
	switch(direction)
	{ 
		case Direction.Left:
			player.theta -= player.rotateSpeed;
			break;
		case Direction.Up:
			var dx = Math.sin(player.theta) * player.forwardSpeed;
			var dy = Math.cos(player.theta) * player.forwardSpeed;
			player.x += dx;
			player.y -= dy;
			break;
		case Direction.Right:
			player.theta += player.rotateSpeed;
			break;
		case Direction.Down:
			var dx = Math.sin(player.theta) * player.forwardSpeed;
			var dy = Math.cos(player.theta) * player.forwardSpeed;
			player.x -= dx;
			player.y += dy;
			break;
	}
}

//
// Shoot Action
function shoot(x, y, theta) {
	if(player.shotCounter == 0) {
		var laser = new Laser(x,y,theta);
		laserQueue.push(laser);
		player.shotCounter = 15;
	}
}

// Spawn NPC
function spawnNPC() {
	var x, y, s;
	x = Math.random() * 10000 % canvas.width;
	y = Math.random() * 10000 % canvas.height;
	s = new Sprite(x, y, loadImage("media/sprite.png"));
	spriteQueue.push(s);
}

//*****************************************************************************
//*****************************************************************************

//
// Sprite Basic Object
function Sprite (x, y, image) {
	this.x = x;
	this.y = y;
	this.image = image;
}

//
// Basic Laser Object
function Laser(x, y, theta) {
	this.x = x;
	this.y = y;
	this.theta = theta;
	this.size = 5;
	this.speed = 20;
}