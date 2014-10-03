


/* CONFIG PARAMS */

var timeScale = 1;

var __xOffset = 0;
var __yOffset = 0;

var __mobileWidth = 750;
var __mobileHeight = 550;




/* DO NOT TOUCH */
var lastTime = new Date().getTime();
var ctx;
var _w, _h;
var __gameObjects = [];

var __currentScene = null;
var __realTime = 0;

IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
IS_IPHONE = (navigator.userAgent.match(/iPhone/i) != null) || (navigator.userAgent.match(/iPod/i) != null);
if (IS_IPAD) {
  IS_IPHONE = false;
}

IOS = (IS_IPAD || IS_IPHONE);

ANDROID =  (navigator.userAgent.toLowerCase().indexOf("android")) > -1;


$(document).bind("mobileinit", function(){
  //apply overrides here
  $.mobile.loadingMessage = false;
});

$(document).ready(function() {

	__realTime = Date.now();


	for(var i = 0; i < 100; i++) {
		Keyboard.unpressKey(i);
	}

	document.ontouchmove = function(e) {
		e.preventDefault();
	}
	
	$(document.body).keydown(function(evt) {
		Keyboard.pressKey(evt.which);	
	});
	
	
	$(document.body).keyup(function(evt) {
		Keyboard.unpressKey(evt.which);
	});

	
	canvas = $('#game')[0];
	
	
	
	var scale = 1;
	

	canvas.width = __mobileWidth;
	canvas.height = __mobileHeight;
	scale = 1;

	
	Stage.width = canvas.width;
	Stage.height = canvas.height;
	Stage.scale = scale;
	
	
	
	$('#game').live('vmousemove', function(e) {
		Mouse.x = (e.clientX - __xOffset) / Stage.scale;
		Mouse.y =  ((e.clientY - __yOffset) / Stage.scale) - Stage.letterBoxOffset;
	});

	$('#game').live('vmousedown', function(e) {
		Mouse.isDown = true;
		Mouse.x = (e.clientX - __xOffset) / Stage.scale;
		Mouse.y =  ((e.clientY - __yOffset) / Stage.scale) - Stage.letterBoxOffset;
	});

	$('#game').live('vmouseup', function(e) {
		Mouse.isDown = false;
		Mouse.x = (e.clientX - __xOffset) / Stage.scale;
		Mouse.y =  ((e.clientY - __yOffset) / Stage.scale) - Stage.letterBoxOffset;
	});

	
	
	var ch = $('#canvasHolder');
	ch.css('position', 'absolute');
	ch.css('left', __xOffset);
	ch.css('top', __yOffset);
	
	console.log("SCALE: " + Stage.scale);
	_w = canvas.width;
	_h = canvas.height;
	ctx = canvas.getContext('2d');
	
	__director = new Director();
	
	var defaultScene = new Scene("DefaultScene");
	
	__director.loadScene(defaultScene);

	gameLoop(lastTime);

});


var Keyboard = Base.extend({},{
	pressedKeys: [],
	keyPressed: false,
	keyCode: -1,
	KEY_UP: 38,
	KEY_DOWN: 40,
	KEY_LEFT: 37,
	KEY_RIGHT: 39,
	KEY_SPACE: 32,
	
	isKeyPressed: function(keyCode) {
		return Keyboard.pressedKeys[keyCode];
	},
	
	pressKey: function(keyCode) {
		Keyboard.pressedKeys[keyCode] = true;
	},
	
	unpressKey: function(keyCode) {
	 	Keyboard.pressedKeys[keyCode] = false;
	}
	
});

var Mouse = Base.extend({ }, {

	isDown : false,
	x : 0,
	y : 0

});

var Stage = Base.extend({}, {
	width: 960,
	height: 640,
	scale: 1,
	letterBoxOffset: 0,
});

var Vector2 = Base.extend({

	constructor : function(x, y) {
		this.x = x;
		this.y = y;
	},

	x : 0,
	y : 0,

	add : function(otherVector) {
		return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
	},

	subtract : function(otherVector) {
		return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
	},
	
	distanceTo: function(otherVector) {
		term1 = (otherVector.x - this.x);
		term2 = (otherVector.y - this.y);
		term1 *= term1;
		term2 *= term2;
		distance = Math.sqrt(term1 + term2);
		return distance;
	},
	
	rotateAround: function(otherVector, angle) {
		
		var newX = Math.cos(angle) * (this.x - otherVector.x) - Math.sin(angle) * (this.y - otherVector.y) + otherVector.x;
		var newY = Math.sin(angle) * (this.x - otherVector.x) + Math.cos(angle) * (this.y - otherVector.y) + otherVector.y;
		return new Vector2(newX, newY);
		
	},
	
	clone: function() {
		return new Vector2(this.x, this.y);
	}, 
	
	
	dot: function(v) {
		return (this.x * v.x) + (this.y * v.y);
	},
	
	magnitude: function() {
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	},
	
	cross: function(v) {
		/*
		U x V = Ux*Vy-Uy*Vx
		*/
		
		return (this.x * v.y) - (this.y * v.x);
		
	}
	
});

var Color = Base.extend({
	constructor : function(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
	},

	r : 1,
	g : 0,
	b : 0
});

var GameObject = Base.extend({

	constructor : function(name, addToScene) {
		this.name = name;
		this.transform = new Transform(new Vector2(0, 0), new Vector2(1, 1), 0);
		this.renderer = new Renderer();
		this.components = [];
		this.children = [];
		this.addComponent(this.transform);
		this.addComponent(this.renderer);

		if ( typeof addToScene === "undefined") {
			__director.addGameObject(this);
		} else {
			if (addToScene) {
				__director.addGameObject(this);
			}
		}
		this.enabled = true;

	},

	name : "GameObject",
	components : [],
	children : [],
	transform : undefined,
	renderer : undefined,
	parentGameObject : undefined,
	drawBoundingBox: false,
	boundingBox: undefined,

	update : function(dt) {
		if(this.enabled) {
			for (var ci in this.components) {
				this.components[ci].update(dt);
			}
	
			for (var chi in this.children) {
				this.children[chi].update(dt);
			}
		}
	},

	draw : function(dt) {
		if(this.enabled) {
			ctx.save();
			//	console.log("TRANSLATING: " + this.transform.position.x +","+ this.transform.position.y);
			ctx.translate(Math.round(this.transform.position.x), Math.round(this.transform.position.y));
			
			
			ctx.scale(this.transform.scale.x, this.transform.scale.y);
			
			//console.log("ROTATING: " + this.transform.rotation);
			ctx.rotate(this.transform.rotation);
	
			ctx.save();
			this.renderer.draw(dt);
			ctx.restore();
	
			for (var chi in this.children) {
	
				this.children[chi].draw(dt);
	
			}
			ctx.restore();
			
			
			
			
			
		}
	},

	addComponent : function(component) {
		component.gameObject = this;
		this.components.push(component);
		if ( component instanceof Renderer) {
			this.renderer = component;
		}

		if ( component instanceof Transform) {

			this.transform = component;
		}
		
		
		if ( component instanceof BoundingBox ) {
			this.boundingBox = component;
		}
		
		return component;

	},

	getComponent : function(type) {
		for (var ci in this.components) {
			if (this.components[ci] instanceof type) {
				return this.components[ci];
			}
		}
		return null;
	},

	removeComponent : function(component) {
		
	//	console.log("REMOVING COMPONENT: " + component);
		
		for (var ci in this.components) {
			if (this.components[ci] == component) {
				component.ondestroy();
				delete this.components[ci];
				return;
			}
		}
	},

	removeChildGameObject : function(child) {

		for (var chi in this.children) {
			if (this.children[chi] == child) {
				
					
				this.children[chi].parentGameObject = undefined;
				delete this.children[chi];
			}
		}
	},
	
	removeFromParent: function() {
		this.parentGameObject.removeChildGameObject(this);	
	},
	
	destroy: function() {

		
		for(var chi in this.children) {
			this.children[chi].destroy();	
		}
		
		for(var ci in this.components) {
			this.components[ci].ondestroy();	
			delete this.components[ci];
		}
		
		this.removeFromParent();
		
	},

	addChild : function(child) {
		if (!( typeof child.parentGameObject === "undefined")) {
			child.parentGameObject.removeChildGameObject(child);
		}

		child.parentGameObject = this;
		this.children.push(child);
	}
}, {

	findByName : function(name) {
		return __director.currentScene().namedGameObjects[name];
	}
});

var Component = Base.extend({
	constructor : function() {
	},

	enabled : true,
	gameObject : undefined,
	__started : false,

	update : function(dt) {
		if (!this.__started) {
			this.onbegin();
			this.__started = true;
		}

		if (this.enabled)
			this.onupdate(dt);
	},

	onupdate : function(dt) {

	},


	onbegin : function() {
	},
	
	ondestroy: function() {
		
	}
});

var Transform = Component.extend({

	constructor : function(position, scale, rotation) {
		this.position = position;
		this.rotation = rotation;
		this.scale = scale;
	},

	position : Vector2(0, 0),

	translate2f : function(dx, dy) {
		this.position.x += dx;
		this.position.y += dy;
	},

	translatev : function(delta) {
		this.position = this.position.add(delta);
	},

	getGlobalPosition : function() {
		if (!( typeof this.gameObject.parentGameObject === 'undefined')) {
			return new Vector2(this.gameObject.parentGameObject.transform.getGlobalPosition().x + this.position.x, this.gameObject.parentGameObject.transform.getGlobalPosition().y + this.position.y);
		} else {
			return this.position;
		}
	},
	
	getGlobalRotation: function() {
		if (!( typeof this.gameObject.parentGameObject === 'undefined')) {
			return this.rotation + this.gameObject.parentGameObject.transform.getGlobalRotation();
		} else {
			return this.rotation;
		}	
	},
			
	globalToLocal : function(point) {
		return point.subtract(this.getGlobalPosition());
	}
});

var Renderer = Component.extend({

	constructor : function() {
	},

	draw : function(dt) {
		if (this.enabled)
			this.ondraw(dt);
	},

	ondraw : function(dt) {

	}
});

var BoundingBox = Component.extend({
	constructor : function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		
		this.x0 = x;
		this.y0 = y;
		this.x1 = x + width;
		this.y1 = y + height;
		
		this.area = this.width * this.height;
		
	},

	x : 0,
	y : 0,
	width : 0,
	height : 0,
	area: 0,
	
	
	onupdate: function(dt) {
	
		var globalPosition = this.gameObject.transform.getGlobalPosition();

		this.x += globalPosition.x;
		this.y += globalPosition.y;
	
		this.x1 =  this.width;
		this.y1 =  this.height;
	
		var topLeft = 		new Vector2(this.x0, this.y0);
		var topRight = 		new Vector2(this.x1, this.y0);
		var bottomLeft = 	new Vector2(this.x0, this.y1);
		var bottomRight = 	new Vector2(this.x1, this.y1);
		
	var globalRotation = this.gameObject.transform.getGlobalRotation();
	
			var localPosition = this.gameObject.transform.position;
		var diff = globalPosition.subtract(localPosition);
		
		
		topLeft = topLeft.add(globalPosition);
		topRight = topRight.add(globalPosition);
		bottomLeft = bottomLeft.add(globalPosition);
		bottomRight = bottomRight.add(globalPosition);
		
		var localPivot = topLeft.subtract(localPosition);
		
		
		this.topLeft = topLeft.rotateAround(localPivot, globalRotation); // a
		this.topRight = topRight.rotateAround(localPivot, globalRotation); // b
		this.bottomLeft = bottomLeft.rotateAround(localPivot, globalRotation); // c
		this.bottomRight = bottomRight.rotateAround(localPivot, globalRotation); //d
		
		this.area = this.width * this.height;
		
	},

	boxContainsPoint : function(point) {
		
		
		var apd = this.areaTriangle(this.topLeft, point, this.bottomRight);
		var dpc = this.areaTriangle(this.bottomRight, point, this.bottomLeft);
		var cpb = this.areaTriangle(this.bottomLeft, point, this.topRight);
		var pba = this.areaTriangle(point, this.topRight, this.topLeft);
		
		var sum = apd + dpc + cpb + pba;
		
		if(sum > this.area) {
			return false;
		} else {
			return true;
		}
		
	},
	
	
	boxContainsBox: function(box) {
	
	
	
	
	
		return  (this.boxContainsPoint(box.topLeft) || this.boxContainsPoint(box.topRight) || this.boxContainsPoint(box.bottomLeft) || this.boxContainsPoint(box.bottomRight));
	},
	
	areaTriangle: function(A, B, C) {
		var t1 = A.x * (B.y - C.y);
		var t2 = B.x * (C.y - A.y);
		var t3 = C.x * (A.y - B.y);
		
		var tn = t1 + t2 + t3;
		
		return Math.abs(tn/2);
		
	}
	
	
	
});

var TextRenderer = Renderer.extend({

	constructor : function(){
	},
	
	align : "center",
	text : undefined,

	ondraw: function(dt) {
		ctx.font = '20px "8BIT WONDER Nominal"';
		ctx.textAlign = this.align;
		ctx.fillStyle = 'white';
		ctx.fillText(this.text, 0, 0);

	}

});

var SquareRenderer = Renderer.extend({
	constructor : function(color, width, height) {
		this.color = color;
		this.width = width;
		this.height = height;
	},

	color : undefined,
	alpha : 1,
	width : 0,
	height : 0,
	offsetX: 0,
	offsetY: 0,
	//centered: false,

	ondraw : function(dt) {
		
		ctx.save();
		ctx.translate(this.offsetX, this.offsetY);
		ctx.globalAlpha = this.alpha;
		ctx.fillStyle = "rgb(" + this.color.r + "," + this.color.g + "," + this.color.b + ")";
		ctx.fillRect(0,0, this.width, this.height);
		ctx.restore();
	}
});


var SpriteRenderer = Renderer.extend({
	
	constructor: function(image) {
		this.image = image;
		this.width = image.width;
		this.height = image.height;
		this.centered = false;
		this.offsetX = 0;
		this.offsetY = 0;
	},
	
	scaleX: 1,
	scaleY: 1,
	alpha: 1.0,
	image: undefined,
	width:0,
	height:0,
	
	ondraw: function(dt) {
		ctx.globalAlpha = this.alpha;
		if(this.centered){
			ctx.drawImage(this.image, (-this.image.width/2) + (this.offsetX), (-this.image.height/2) + this.offsetY, this.scaleX * this.width, this.scaleY * this.height);
		} else {
			ctx.drawImage(this.image, this.offsetX, this.offsetY, this.scaleX * this.width, this.scaleY * this.height);
		}
		
	}
	
	
	
});

var AdvancedSpriteSheetRenderer = Renderer.extend({
	
	constructor: function(image, imageData, fps) {
		this.image = image;
		this.imageData = imageData;
		this.fps = fps;
		this.playingAnimation = null;
		this.defaultAnimation = null;
		this.currentFrame = -1;
		this.realFrame = 0;
		this.numberOfFrames = 0;
		this.timer = 0;
		this.loop = true;
		this.offsetX = 0;
		this.offsetY = 0;
		this.centered = false;
		this.onFinish = null;
		this.arg_1 = null;
		this.paused = false;
	},
	
	
	onupdate: function(dt) {
		
		if(!this.paused) {
		
			this.timer += dt;
			
			if(this.timer >= (1 / this.fps)) {
				this.timer = 0;
				this.nextFrame();
			}
		
		}
		
	},
	
	nextFrame: function() {
	
	
		if(!this.loop && this.currentFrame == this.numberOfFrames - 1) {
			if(this.defaultAnimation != null)
				this.playAnimation(this.defaultAnimation)
			this.loop = true;
			if(this.onFinish != null) {
				if(this.arg_1 != null)
					this.onFinish(this.arg_1);
				else
					this.onFinish();
					
				this.onFinish = null;
				this.arg_1 = null;
			}
		}
		if(this.playingAnimation != null) {
			this.currentFrame = (this.currentFrame + 1) % this.numberOfFrames;
			this.realFrame = this.currentFrame + this.playingAnimation.minFrame;
		}
	},
	
	
	playAnimation: function(animation) {
		this.playingAnimation = animation;
		this.numberOfFrames = animation.maxFrame - animation.minFrame;
		this.currentFrame = 0;
	},
	
	ondraw: function(dt) {
		
		var i_x, i_y, i_w, i_h;
		
		i_x = this.imageData.frames[this.realFrame].frame.x;
		i_y = this.imageData.frames[this.realFrame].frame.y;
		i_w = this.imageData.frames[this.realFrame].frame.w;
		i_h = this.imageData.frames[this.realFrame].frame.h;
		if(this.centered) {
			ctx.drawImage(this.image, i_x, i_y, i_w, i_h, -(i_w/2) + this.offsetX, -(i_h/2) + this.offsetY, i_w, i_h);
		} else {
			ctx.drawImage(this.image, i_x, i_y, i_w, i_h, this.offsetX, this.offsetY, i_w, i_h);
		}
		
	}
	
});


var SpriteSheetRenderer = SpriteRenderer.extend({
	constructor: function(image, rows, columns, f_width, f_height, fps) {
		this.image = image;
		this.width = image.width;
		this.height = image.height;
		this.f_width = f_width;
		this.f_height = f_height;
		this.rows = rows;
		this.columns = columns;
		this.fps = fps;
		this.currentRow = 0;
		this.currentColumn = 0;
		this.numberOfFrames = rows * columns;
		this.timer = 1 / fps;
		this.minFrame = 0;
		this.maxFrame = 15;
		this.currentFrame = this.minFrame - 1;
		this.nextFrame();
		this.paused = false;
		this.loop = true;
		this.offsetX = 0;
		this.offsetY = 0;
	},
	
	nextFrame: function() {
		this.currentFrame = ((this.currentFrame + 1) % (this.maxFrame + 1 - this.minFrame)) + this.minFrame;
		if(!this.loop && this.currentFrame == this.maxFrame) {
			this.gameObject.removeComponent(this);
		}
		
			this.currentColumn = (this.currentFrame % this.columns);
			this.currentRow = (this.currentFrame - this.currentColumn) / this.columns;
	},
	
	onupdate: function(dt) {
		if(!this.paused) {
			this.timer -= dt;
			if(this.timer <= 0) {
				this.nextFrame();
				this.timer = 1 / this.fps;
			}	
		}
	},
	
	playAnimation: function(animation) {
		this.minFrame = animation.minFrame;
		this.maxFrame = animation.maxFrame;
		this.currentFrame = this.minFrame - 1;
		this.nextFrame();	
	},
	
	ondraw: function(dt) {
		ctx.drawImage(this.image,
		 this.currentColumn * this.f_width,
		  this.currentRow * this.f_height,
		   this.f_width,
		    this.f_height,
		     -this.scaleX * this.f_width / 2 + this.offsetX, - this.scaleY * this.f_height + this.offsetY,
		      this.f_width * this.scaleX, this.f_height * this.scaleY);
			  
		      
		    
	}
	
});


var SpriteAnimation = Base.extend({
	
	constructor: function(minFrame, maxFrame) {
		this.minFrame = minFrame;
		this.maxFrame = maxFrame;
	}
	
});


var Director = Base.extend({
	
	
	scenes: [],
	
	constructor: function() {
		this.scenes = [];
	},
	
	loadScene: function(scene) {
		if(this.scenes.length <= 0) {
			this.scenes[0] = scene;
		} else {
			this.scenes[this.scenes.length - 1] = scene;	
		}
		
		scene.start();
	},
	
	pushScene: function(scene) {
		this.scenes.push(scene);
		this.scenes[this.scenes.length - 1].start();
	},
	
	popScene: function(scene) {
		var destroyedScene = this.scenes.pop();
		destroyedScene.destroy();
	},
	
	addGameObject: function(go) {
		this.scenes[this.scenes.length - 1].addGameObject(go);
	},
	
	update: function(dt) {
		this.scenes[this.scenes.length - 1].update(dt);
	},
	
	draw: function(dt) {
		this.scenes[this.scenes.length - 1].draw(dt);
	},
	
	currentScene: function() {
		return this.scenes[this.scenes.length - 1];
	}
	
	
	
	
});

var Scene = Base.extend({

	constructor : function(name) {
		this.rootObject = new GameObject("RootObject", false);
		this.name = name;
	},

	rootObject : undefined,
	namedGameObjects : [],

	start : function() {


		/*if(__currentScene != null)
			__currentScene.destroy();
		__currentScene = this;*/
		Mouse.isDown = false;
		timeScale = 1;
		this.onstart();
	},


	draw : function(dt) {
		this.rootObject.draw(dt);
	},

	update : function(dt) {
		this.rootObject.update(dt);
	},

	addGameObject : function(go) {
		this.rootObject.addChild(go);
		this.namedGameObjects[go.name] = go;
	},
	
	onstart: function() {
		
	},
	
	destroy: function() {
		
		
		
		for(var child in this.rootObject.children) {
			this.rootObject.children[child].destroy();
		}
		
		for (var name in this.namedGameObjects) {
			this.namedGameObjects[name] = null;	
		}
	
	}
});

var MouseClickListener = Component.extend({

	isClick : true,
	allow : true,
	lastTimeClick: 0,

	onupdate : function(dt) {
		if (this.allow && Mouse.isDown) {
			mousePos = new Vector2(Mouse.x, Mouse.y);
			box = this.gameObject.getComponent(BoundingBox);
			if (box.boxContainsPoint(mousePos)) {
				this.isClick = true;
			}
		}

		if (Mouse.isDown) {
			if (this.isClick) {
				mousePos = new Vector2(Mouse.x, Mouse.y);
				//console.log("mousePos: " + mousePos.x + "," + mousePos.y);
				
				if (this.gameObject.boundingBox.boxContainsPoint(mousePos)) {
				//console.log("DIFFERENCE:" + (__realTime - this.lastTimeClick));
					if(__realTime - this.lastTimeClick >= 100) {
						console.log("CLICK");
						this.lastTimeClick = __realTime;
						this.onclick(dt);
						this.isClick = false;
						this.allow = false;
					}
					
				}

			}
		}

		if (!Mouse.isDown) {
			this.allow = true;
			
		}
	},

	onclick : function(dt) {
		console.log("Clicked: " + this.gameObject.name);
	}
});


function lerpVector(from, to, currentTime, targetTime) {
	return new Vector2(lerpNumber(from.x, to.x, currentTime, targetTime), lerpNumber(from.y, to.y, currentTime, targetTime));
}

function lerpNumber(from, to, currentTime, targetTime) {
	var diff = to - from;
	var progress = currentTime / targetTime;
	return from + (progress * diff);
}

function lerp(min, max, value) {
	if(value <= 0) {
		return min;
	} else if(value >= 1) {
		return max;
	} else {
		return ((max - min) * value) + min;
	}
}


function randomRange(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gameLoop(t) {

	dt = t - lastTime;
	__realTime += dt;
	update(dt / 1000);
	draw(dt / 1000);
	lastTime = t;
	requestAnimationFrame(gameLoop);

};

function update(dt) {
//	TWEEN.update(__realTime);
//	__currentScene.update(dt * timeScale);
__director.update(dt * timeScale);
}

function draw(dt) {

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, _w, _h);
	
	
	
	ctx.save();
	ctx.scale(Stage.scale, Stage.scale);
	ctx.translate(0,Stage.letterBoxOffset,0);
	//__currentScene.draw(dt * timeScale);
	__director.draw(dt * timeScale);
	ctx.restore();

	ctx.fillStyle = 'white';
	/*ctx.save();
	ctx.scale(5, 5);
	ctx.fillText("" + Math.round((1 / dt)), 10, 10);
	ctx.restore();*/
}

var TimedExecution = Component.extend({
	 constructor: function(time, f) {
	 
	 	this.timer = 0;
	 	this.time = time;
		this.f = f;
	 
	 },
	 
	 onupdate: function(dt) {
	 	this.timer += dt;
		if(this.timer >= this.time) {
		
			this.f();
			this.gameObject.removeComponent(this);
				
		}
	 }

});

var Fader = Component.extend({
	
	constructor: function(time, speed) {
		this.time = time;
		this.timer = 0;
		this.speed = speed;
		this.oncomplete = null;
	},
	

	
	onupdate: function(dt) {
		this.timer += dt;
		if(this.timer <= this.time) {
			this.gameObject.renderer.alpha += (this.speed/this.time)*dt;
		}else{
			//this.gameObject.transform.position = new Vector2(-1000, -1000);
			if(this.oncomplete != null) {
				this.oncomplete();
			}
			this.gameObject.removeComponent(this);
		}
	}
	
});

var PingPongFader = Component.extend({

	constructor: function(speed) {
		this.speed = speed;
	},
	
	onupdate: function(dt) {

			if(this.gameObject.renderer.alpha >= 1 || this.gameObject.renderer.alpha <= 0.1) {
				if(this.gameObject.renderer.alpha >= 1)
					this.gameObject.renderer.alpha = 1.0;
				if(this.gameObject.renderer.alpha <= 0.1)
					this.gameObject.renderer.alpha = 0.1;
				this.speed *= -1;
			}
				this.gameObject.renderer.alpha += (this.speed)*dt;
	
		
	}

});

var LinearScale = Component.extend({
	
	constructor: function(scale, time) {
		this.scale = scale;
		this.time = time;
		this.timer = 0;
	},
	
	onbegin: function() {
		this.speedX = (this.gameObject.transform.scale.x - this.scale.x)/this.time;
		this.speedY = (this.gameObject.transform.scale.y - this.scale.y)/this.time;
	},
	
	onupdate: function(dt) {
		
		this.timer += dt;
	
		if(this.timer <= this.time) {
			this.gameObject.transform.scale.x += (this.speedX *dt);
			this.gameObject.transform.scale.y += (this.speedY *dt);
		} else {
			this.gameObject.removeComponent(this);
		}
	}
	
});

var LinearTween = Component.extend({
	
	constructor: function(destinationX, destinationY, time) {

		this.destinationX = destinationX;
		this.destinationY = destinationY;
		this.time = time;
		this.timer = 0;
		this.onfinish = null;
		this.arg1 = null;
	
	},
	
	onbegin: function() {
		
		this.speedX = (this.destinationX - this.gameObject.transform.position.x);
		this.speedY = (this.destinationY - this.gameObject.transform.position.y);
	
	},
	
	
	onupdate: function(dt) {
		
		this.timer += dt;

		if(this.timer <= this.time) {
	
			this.gameObject.transform.position.x += (this.speedX/this.time * dt);
			this.gameObject.transform.position.y += (this.speedY/this.time * dt);
		
			
		} else {
			if(this.onfinish != null) {
				if(this.arg1 != null)
					this.onfinish(this.arg1);	
				else
					this.onfinish();
			}
			this.gameObject.removeComponent(this);
		}

	}
	
});

var ButtonMusicPauser = MouseClickListener.extend({
	
	constructor: function() {
		this.muted = false;
	},
	
	onclick: function(dt) {
		if(this.muted) {
			if(!ANDROID)
			soundManager.resumeAll();
			this.gameObject.getComponent(SpriteRenderer).enabled = false;
			this.muted = false;
		} else {
			this.gameObject.getComponent(SpriteRenderer).enabled = true;
			if(!ANDROID)
			soundManager.pauseAll();
			this.muted = true;
		}
	}
	
	
	
});


var Button = MouseClickListener.extend({
	
	constructor: function(clickHandler) {
		this.clickHandler = clickHandler;
	},
	
	onclick: function(dt) {
		this.clickHandler();
	}
	
});


