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

// Load Media
var playerImage = loadImage("media/car.png");
var enemyImage = loadImage("media/sprite.png");
var tileBack = loadImage("media/rocktile.png");
var brownRock = loadImage("media/brownrock.png");
var explodeImage = loadImage("media/explode.png");

//
// Game Constants
var Direction = { Up:0, Down:1, Left:2, Right: 3 };
var enemyRadius = 300;
var PLAYER_TYPE = "player";
var ENEMY_TYPE = "enemy";
var PROJECTILE_TYPE = "projectile";
var LANDSCAPE_TYPE = "landscape";
var EXPLOSION_TYPE = "explosion";


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
// Fade in Top Message
function displayMessage(message, time) {
	var overlay = $("#overlay");
	overlay.html(message);
	overlay.fadeIn(2000).delay(time).fadeOut(2000);
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

	// Display Welcome Message
	displayMessage("Welcome to Mars. You are the Curiosity Rover. Use the Arrow Keys to move, and Shift to fire your laser!", 5000);

	// Setup player sprite
	player = new Sprite(PLAYER_TYPE, canvas.width / 2 - playerImage.width / 2, canvas.height / 2 - playerImage.height / 2, playerImage);
	player.theta = 0;
	player.forwardSpeed = 4;
	player.rotateSpeed = 0.06;
	player.shotCounter = 0;
	player.safeArea = 300;

	// Create some random NPCs
	for(var i = 0; i < 2; i++) {
		spawnNPC();
	}

	for(var i = 0; i < 20; i++) {
		spawnTerrain();
	}


	$(document).keydown(function (e) { eventQueue.push(e); if(e.which == 32) e.preventDefault(); });
	$(document).keyup(function (e) { eventQueue.push(e) });

	setInterval(gameLoop, 15);
}

//
// Main Game Loop
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
			   					l.y - y > spriteQueue[j].y && l.y - y < spriteQueue[j].y + spriteQueue[j].image.height &&
			   					(spriteQueue[j].type == ENEMY_TYPE || spriteQueue[j].type == LANDSCAPE_TYPE))
			   				{
		 						//Delete laser, remove sprite, create explosion and respawn
			   					laserQueue.remove(i);
			   					//Kill enemy
			   					spriteQueue.remove(j)
			   					createExplosion(l.x, l.y);
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
		if(keysDown[37]) { // Left Arrow
			movePlayer(Direction.Left);
		}
		if(keysDown[38]) { // Up Arrow
			movePlayer(Direction.Up);
		}
		if(keysDown[39]) { // Right Arrow
			movePlayer(Direction.Right);
		}
		if(keysDown[40]) { // Down Arrow
			movePlayer(Direction.Down);
		}
		if(keysDown[16]) {
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

	
	// Update All Sprites
		for (var i = 0; i < spriteQueue.length; i++) 
		{
			var s = spriteQueue[i];
			// Update Enemy Sprites
			if( s.type == ENEMY_TYPE) {
				//Move NPCs towards the player
				s.x = s.x - Math.sin(Math.atan2((s.x + s.image.width / 2) - player.x, player.y - (s.y + s.image.height / 2))) * s.speed;
				s.y = s.y + Math.cos(Math.atan2(player.x - (s.x + s.image.width / 2), player.y - (s.y + s.image.height / 2))) * s.speed;
			}
			else if( s.type == EXPLOSION_TYPE) {
				s.phaseCounter--;
				if(s.phaseCounter <= 0) {
					s.phaseCounter = s.rows * s.cols;
					s.phase = (s.phase + 1) % (s.rows * s.cols);
					if(s.phase == (s.rows * s.cols) - 1) {
						spriteQueue.remove(i);
					}
				}
			}
		};
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

	// Draw Basic Sprites
	for (var i = spriteQueue.length - 1; i >= 0; i--) {
		var e = spriteQueue[i];
		ctx.drawImage(e.image, e.x, e.y);
	};

	// Draw Lasers
	ctx.strokeStyle = "red";
	ctx.lineWidth = 3;
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
	s = new Sprite(ENEMY_TYPE, 0, 0, enemyImage);
	do
	{
		s.x = Math.random() * 10000 % canvas.width;
		s.y = Math.random() * 10000 % canvas.height;
	}while (!isInsideCanvas(s) || isCollidingWithObject(s.x, s.y, enemyImage.width, enemyImage.height) || isInSafeArea(s));
	
	spriteQueue.push(s);
}

// Spawn NPC
function spawnTerrain() {
	var x, y, s;
	s = new Sprite(LANDSCAPE_TYPE, 0, 0, brownRock);
	do
	{
		s.x = Math.random() * 10000 % canvas.width;
		s.y = Math.random() * 10000 % canvas.height;
	}while (!isInsideCanvas(s) || isCollidingWithObject(s.x, s.y, brownRock.width, brownRock.height) || isInSafeArea(s));
	
	spriteQueue.push(s);
}

//
// Create Explosion
function createExplosion(x,y) {
	var explosion = new SpriteMap(EXPLOSION_TYPE, x, y, explodeImage, 66, 64, 1, 6);
	spriteQueue.push(explosion);
}

// Check for a location overlap
// See if two boxes overlap each other
function locationOverlap(aLeft, aRight, aTop, aBottom, bLeft, bRight, bTop, bBottom) {
	if (aRight < bLeft) return false;
	if (aLeft > bRight) return false;
	if (aBottom < bTop) return false;
	if (aTop > bBottom) return false;
	return true;
}

// Check Spawn Area
// Ensures a sprite spawns within a legal area and not on top of another sprite
// Returns false if no collisions are detected
// Returns true if a collision is detected
function isCollidingWithObject(checkX, checkY, checkWidth, checkHeight) {
		//Do we include the player in the calculation?
		//Are we spawning too close to the player?

		//Check the existing sprites to ensure no overlap
		for (var i = 0; i < spriteQueue.length; i++) 
		{
			if (locationOverlap(	checkX,
									(checkX + checkWidth), 
									checkY, 
									(checkY + checkHeight), 
									spriteQueue[i].x, 
									(spriteQueue[i].x + spriteQueue[i].image.width), 
									spriteQueue[i].y, 
									(spriteQueue[i].y + spriteQueue[i].image.height))) {
				return true;
			}
		};
		return false;
}

//
// Check if sprite is inside the canvas
function isInsideCanvas(myObj) {
	if(myObj.x >= 0 && myObj.y >= 0 && (myObj.x + myObj.image.width) <= canvas.width && (myObj.y + myObj.image.height) <= canvas.height)
		return true;
	else
		return false;
}

//
// Check if sprite is inside the players' safe area
function isInSafeArea(myObj) {
	if (Math.pow((myObj.x + myObj.image.width / 2) - (player.x + player.image.width / 2), 2) + Math.pow((myObj.y + myObj.image.width / 2) - (player.y + player.image.height / 2), 2) <= Math.pow(player.safeArea, 2))
		return true;
}

//
// Spawns an NPC within a weighted random of other NPCs
function respawnNPC() {
	var s;
	s = new Sprite(ENEMY_TYPE, 0, 0, enemyImage);

	//Calculate the average sprite locations
	var xavg = 0, yavg = 0, enemyCount = 0;
	for (var i = 0; i < spriteQueue.length; i++) {
		if (spriteQueue[i].type != ENEMY_TYPE) {
			continue;
		}
		xavg = xavg + spriteQueue[i].x + (spriteQueue[i].image.width / 2);
		yavg = yavg + spriteQueue[i].y + (spriteQueue[i].image.height / 2);
		enemyCount++;
	};
	xavg = xavg / enemyCount;
	yavg = yavg / enemyCount;

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
	} while (!isInsideCanvas(s) || isCollidingWithObject(s.x, s.y, enemyImage.width, enemyImage.height) || isInSafeArea(s) );

	//Make the sprite and push it to the spriteQueue
	spriteQueue.push(s);
}

//
// Check Line of Sight. If we have a straight shot from one point to another, used for enemy burrowing and projectile decisions.
function hasLoS(x1, x2, y1, y2) {
	var i, xc, yc, objTheta, isClear = true;
	//First, calculate pythagorean distance between the two points
	var dist = Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));

	dy = y1 - y2;
	dx = x1 - x2;
	objTheta = Math.atan2(dy, dx);
	//Incrementally check an area to see if there is anything blocking LoS
	for (i = 0; i < dist; i+=5)
	{
		xc = x1 - Math.cos(objTheta) * i;
		yc = y1 - Math.sin(objTheta) * i;
		if(!isCollidingWithObject(xc, yc, 0, 0) && isClear) {
			isClear = true;
		} else {
			isClear = false;
		}
	};
	return isClear;
}

//*****************************************************************************
//*****************************************************************************

//
// Sprite Basic Object
function Sprite (type, x, y, image) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.speed = 0.50;
	this.image = image;
}

function SpriteMap(type, x, y, image, imagex, imagey, rows, cols) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.speed = 0.50;
	this.image = image;
	this.imagex = imagex;
	this.imagey = imagey;
	this.rows = rows;
	this.cols = cols;
	this.phase = 0;
	this.phaseCounter = rows*cols;
}

//
// Basic Laser Object
function Laser(x, y, theta) {
	this.x = x;
	this.y = y;
	this.theta = theta;
	this.size = 15;
	this.speed = 20;
}