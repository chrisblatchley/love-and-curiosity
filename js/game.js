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
var spriteImage = loadImage("media/sprite.png");
var tileBack = loadImage("media/rocktile.png");
var enemyRadius = 300;

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


// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// Array remove by object
Array.prototype.removeObject = function(object) {
	for (var i = this.length - 1; i >= 0; i--) {
		if(this[i] == object) {
			this.remove[i];
			break;
		}
	};
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
	player.safeArea = 100

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
	laser_loop:
	for (var i = laserQueue.length - 1; i >= 0; i--) {
		var l = laserQueue[i];

		// Calculate next laser location
		var dx = Math.sin(l.theta) * l.speed;
	   	var dy = Math.cos(l.theta) * l.speed;

	   	//Do we have any enemies to check collisions with?
	   	if (spriteQueue.length != 0)
	   	{
	   		// Check for collisions with nearby enemies
		   	enemycheck_loop:
		   	for (var j = spriteQueue.length - 1; j >= 0; j--) {
		   		if( l.x > spriteQueue[j].x - 20 && l.x < spriteQueue[j].x + spriteQueue[j].image.width + 20 &&
		   			l.y > spriteQueue[j].y - 20 && l.y < spriteQueue[j].y + spriteQueue[j].image.height + 20 )
		   		{
		   			// Find an exact calculation of where the collision happened
		   			detailcheck_loop:
		   			for (var k = 1; k <= l.speed; k++) {
		   				var x = Math.sin(l.theta) * k;
		   				var y = Math.cos(l.theta) * k;
		   				if( l.x + x > spriteQueue[j].x && l.x + x < spriteQueue[j].x + spriteQueue[j].image.width &&
		   					l.y - y > spriteQueue[j].y && l.y - y < spriteQueue[j].y + spriteQueue[j].image.height)
		   				{
		   					// Create new hit and add it to sprite queue
		   					// var hit = new Sprite(l.x + x, l.y - y, new Image());
		   					// spriteQueue.push(hit);
		   					console.log("HIT enemy " + j + " at x: " + x + " and y: " + y);

		   					//Delete laser
		   					laserQueue.remove(i);
		   					//Kill enemy
		   					spriteQueue.remove(j)
		   					//Spawn a new NPC
		   					respawnNPC();
		   					//Skip checking other enemies
		   					continue laser_loop;
		   				}
		   			};
		   		}
		   	};
	   	}

		l.x += dx;
	   	l.y -= dy;

	   	// Remove laser if out of bounds
	   	if(l.x < 0 || l.x > canvas.width || l.y < 0 || l.y > canvas.width) {
	   		laserQueue.remove(i);
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

	//Move NPCs towards the player
	for (var i = 0; i < spriteQueue.length; i++) 
	{
		spriteQueue[i].x = spriteQueue[i].x - Math.sin(Math.atan2((spriteQueue[i].x + spriteQueue[i].image.width / 2) - player.x, player.y - (spriteQueue[i].y + spriteQueue[i].image.height / 2))) * spriteQueue[i].speed;
		spriteQueue[i].y = spriteQueue[i].y + Math.cos(Math.atan2(player.x - (spriteQueue[i].x + spriteQueue[i].image.width / 2), player.y - (spriteQueue[i].y + spriteQueue[i].image.height / 2))) * spriteQueue[i].speed;
	};

	console.log(hasLoS(0, canvas.width, 0, canvas.height));
}

//
// Draw the game state to the context
function drawScreen() {
	// Clear Drawing Canvas
	ctx.clearRect(0,0, canvas.width, canvas.height);

	//Draw tile background
	var pattern = ctx.createPattern(tileBack, 'repeat');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = pattern;
    ctx.fill();

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
	s = new Sprite(0, 0, spriteImage);
	do
	{
		s.x = Math.random() * 10000 % canvas.width;
		s.y = Math.random() * 10000 % canvas.height;
	}while (!isInsideCanvas(s) && !isCollidingWithObject(s.x, s.y) && !isInSafeArea(s));
	
	spriteQueue.push(s);
}

// Check for a location overlap
// See if two boxes overlap each other
function locationOverlap(ax1, ax2, ay1, ay2, bx1, bx2, by1, by2)
{
	if (ax2 < bx1) return false;
	if (ax1 > bx2) return false;
	if (ay2 < by1) return false;
	if (ay1 > by2) return false;
	return true;
}

// Check Spawn Area
// Ensures a sprite spawns within a legal area and not on top of another sprite
// Returns false if no collisions are detected
// Returns true if a collision is detected
function isCollidingWithObject(checkX, checkY)
{
		//Do we include the player in the calculation?
		//Are we spawning too close to the player?

		//Check the existing sprites to ensure no overlap
		for (var i = 0; i < spriteQueue.length; i++) 
		{
			if (locationOverlap(	checkX,
									(checkX + spriteImage.width), 
									checkY, 
									(checkY + spriteImage.height), 
									spriteQueue[i].x, 
									(spriteQueue[i].x + spriteQueue[i].image.width), 
									spriteQueue[i].y, 
									(spriteQueue[i].y + spriteQueue[i].image.height))) {
				return true;
			}
		};
		return false;
}

function isInsideCanvas(myObj)
{
	if(myObj.x >= 0 && myObj.y >= 0 && (myObj.x + myObj.image.width) <= canvas.width && (myObj.y + myObj.image.height) <= canvas.height)
		return true;
	else
		return false;
}

function isInSafeArea(myObj)
{
	if (Math.pow((myObj.x + myObj.image.width / 2) - player.x, 2) + Math.pow((myObj.y + myObj.image.width / 2) - player.y, 2) <= Math.pow(player.safeArea, 2))
		return true;
}

// Respawn NPC
// Spawns an NPC within a weighted random of other NPCs
function respawnNPC() {
	var s;
	s = new Sprite(0, 0, spriteImage);

	//Calculate the average sprite locations
	var xavg = 0, yavg = 0;
	for (var i = 0; i < spriteQueue.length; i++) {
		xavg = xavg + spriteQueue[i].x + (spriteQueue[i].image.width / 2);
		yavg = yavg + spriteQueue[i].y + (spriteQueue[i].image.height / 2);
	};
	xavg = xavg / spriteQueue.length;
	yavg = yavg / spriteQueue.length;

	//Choose a random location within the enemyRadius circle of the average, then check to make sure its inside the canvas
	do
	{
		var ylim;
		s.x = Math.random() * 2 * enemyRadius - enemyRadius;
		ylim = Math.sqrt(Math.pow(enemyRadius, 2) - Math.pow(s.x, 2));
		s.y = Math.random() * 2 * ylim - ylim;

		//Now that we've come up with a random location in a circle, add the average locations
		s.x += xavg;
		s.y += yavg;
	}while (!isInsideCanvas(s) && !isCollidingWithObject(s.x, s.y) && !isInSafeArea(s));

	//Make the sprite and push it to the spriteQueue
	spriteQueue.push(s);
}

// Check Line of Sight
// See if we have a straight shot from one point to another, used for enemy burrowing and projectile decisions.
function hasLoS(x1, x2, y1, y2)
{
	var i, xc, yc, objTheta;
	//First, calculate pythagorean distance between the two points
	var dist = Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));

	dy = y1 - y2;
	dx = x1 - x2;
	objTheta = Math.atan2(dy, dx);
	//Incrementally check an area to see if there is anything blocking LoS
	for (i = 0; i < dist; i+=5)
	{
		xc = x1 + Math.sin(objTheta) * i;
		yc = y1 + Math.cos(objTheta) * i;
		$("#message").html("Checking LoS x: " + xc + " y: " + yc);
		if(!isCollidingWithObject(xc, yc))
			return true;
	};
	return false;
}

//*****************************************************************************
//*****************************************************************************

//
// Sprite Basic Object
function Sprite (x, y, image) {
	this.x = x;
	this.y = y;
	this.speed = 0.50;
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

// Basic Enemy Projectile
function EnemyProjectile(x, y, theta)
{
	this.x = x;
	this.y = y;
	this.theta = theta;
	this.speed = 1.5;
}