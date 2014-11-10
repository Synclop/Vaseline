/**
 * TODO:
 * 	- buffer
 * 	- animation
 * 	- resolution
 * 	- bind to resize event
 */
(function(name, definition) {
	if (typeof module != 'undefined'){module.exports = definition();}
	else if (typeof define == 'function' && typeof define.amd == 'object'){define(definition);}
	else{this[name] = definition();}
}('Vaseline',function(){

	/*/////////////////////////////////////////////////////////

		UTILITIES

	/////////////////////////////////////////////////////////*/

	var extend = function(obj1,obj2){
		for(var n in obj2){
			if(obj2.hasOwnProperty(n)){
				obj1[n] = obj2[n];
			}
		}
		return obj1;
	};

	var isFunction = function(obj){
  		return !!(obj && obj.constructor && obj.call && obj.apply);
	};

	var setUp = function(obj1,obj2){
		for(var n in obj2){
			if(obj2.hasOwnProperty(n) && obj1.hasOwnProperty(n)){
				if(isFunction(obj1[n])){
					obj1[n](obj2[n]);
				}
				else{
					obj1[n] = obj2[n];
				}
			}
		}
		return obj1;
	};

	var vaselineInstances = [];

	/**
	 * Shim for cross-browser RequestAnimationFrame
	 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	 * requestAnimationFrame polyfill by Erik Möller
	 * fixes from Paul Irish and Tino Zijdel
	 * @param  {Function} callback function to be called on each frame
	 */
	(function(){
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
		if (!window.requestAnimationFrame){
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); },timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!window.cancelAnimationFrame){
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}());

	/*/////////////////////////////////////////////////////////

		ANIMATION

	/////////////////////////////////////////////////////////*/

	var TweenProperties = {
		object:null
	,	frameRate: 30
	,	timeElapsed: 0
	,	duration: 0
	}

	var TweenMethods = {
		drawFrame: function(){
			var self = this;
			this.nextFrame();
			if (this.isRunning){
				setTimeout(function(){self.drawFrame()}, 1000/this.frameRate);
			};
		}
	,	nextFrame: function(){
			if (this.timeElapsed < this.duration){
			// calculate and update the parameters of the object
			} else{
				this.isRunning = false;
			}
		}
	,	start: function(){
			this.isRunning = true;
			this.drawFrame();
		}
	};

	function Tween(object){
		extend(this,TweenProperties);
		this.object = object;
	}

	extend(Tween.prototype,TweenMethods);

	/*/////////////////////////////////////////////////////////

		EVENTS

	/////////////////////////////////////////////////////////*/

	var EventEmitter = {
		on:function(evt,fn){
			if(!this._events){this._events = {};}
			if(!this._events[evt]){this._events[evt] = [];}
			this._events[evt].push(fn);
			return this;
		}
	,	off:function(evt,fn){
			if(this._events && this._events[evt]){
				var index = this._events.indexOf(fn);
				if(index>=0){
					this._events.splice(index,1);
				}
			}
			return this;
		}
	,	emit:function(evt,args,bindTo){
			if(!this._emitter){return this;}
			if(!bindTo){bindTo = this;}
			if(this._events && this._events[evt]){
				var evts = this._events[evt],fn;
				for(var i=0, l=evts.length;i<l;i++){
					fn = evts[evt];
					fn.apply(bindTo,args);
				}
			}
			return this;
		}
	};

	EventEmitter.trigger = EventEmitter.emmit;
	EventEmitter.addEventListener = EventEmitter.on;
	EventEmitter.removeEventListener = EventEmitter.off;

	Events = {
		RESIZED:'resized'
	,	READY:'ready'
	,	LOADED:'loaded'
	,	ERROR:'error'
	,	DRAWN:'drawn'
	,	DISPLAYED:'displayed'
	,	LOAD_START:'loadStart'
	};

	/*/////////////////////////////////////////////////////////

		VASELINE STATIC METHODS AND PROPERTIES

	/////////////////////////////////////////////////////////*/

	var VaselineStaticProperties = {
		extend:extend
	,	Events:Events
	,	ImageProportions: {
			LANDSCAPE:'landscape'
		,	PORTRAIT:'portrait'
		,	SQUARE:'square'
		}
	,	ImageSizeTypes: {
			CONTAIN:'contain'
		,	COVER:'cover'
		}
		/**
		 * if set to true, will spew errors. Else, will eat them silently
		 * @type {Boolean}
		 */
	,	debug: true
		/**
		 * Is set to true if the browser supports canvas
		 * @type {Boolean}
		 */
	,	supportsCanvas: ('getContext' in document.createElement('canvas'))
		/**
		 * Returns a Vaseline instance
		 * @param  {int} id the id of the Vaseline instance
		 * @return {Vaseline}
		 */
	,	instance: function VaselineGetInstance(id){
			if(!vaselineInstances[id]){
				if(Vaseline.debug){
					throw new Error("Instance "+id+" of Vaseline does not exist");
				}
				return false;
			}
			return vaselineInstances[id];
		}
		/**
		 * Returns a valid canvas id
		 * @param  {Int} id
		 * @return {String}
		 */
	,	makeCanvasId: function VaselineMakeCanvasId(id) {
			return 'vaseline_canvas_'+id;
		}
		/**
		 * Sets the behaviour when an image is ready.
		 * By default, simply calls draw() on the concerned Vaseline object
		 * @param  {Function} fn the function, which will receive the image and be called in the context
		 * of the vaseline object
		 * @return {Vaseline}  the Vaseline Factory
		 */
	,	whenImageReady:function VaselineWhenImageReady(fn){
			if(arguments.length){Vaseline.prototype.imageReady = fn;return this;}
			return Vaseline.prototype.imageReady;
		}
		/**
		 * Test to know if an object is a dom node
		 * @param  {Object}  o
		 * @return {Boolean}
		 */
	,	isDomElement: function VaselineIsDomElement(o){
			return (
				typeof HTMLElement === "object" ?
				o instanceof HTMLElement :
				o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
			);
		}
		/**
		 * Returns the image proportion type
		 * @param  {Int} width
		 * @param  {Int} height
		 * @return {String} "portrait","landscape" or "square"
		 */
	,	getImageProportions: function VaselineGetImageProportions(width,height){
			return (width == height)?Vaseline.ImageProportions.SQUARE:(width<height)?Vaseline.ImageProportions.PORTRAIT:Vaseline.ImageProportions.LANDSCAPE;
		}
		/**
		 * Returns an image size proportionally to the given size, that fits in a container
		 * @param  {Int} width the image width
		 * @param  {Int} height the image height
		 * @param  {Int} containerWidth the container width
		 * @param  {Int} containerHeight the container height
		 * @param  {String} imageSizing one of "contain" or "cover". Will default to the instance default
		 * if nothing is provided (set with cover() or contain())
		 * @return {Object} an object containing `{x:Int,y:Int,width:Int,height:Int}`
		 */
	,	calculateImageSize: function VaselineCalculateImageSize(img,container,imageSizing){
			var containerHeight = container.height
			,	containerWidth = container.width
			,	width = img.width
			,	height = img.height
			,	ratio = (Math.max(width,height) / Math.min(width,height))
			,	marginX = 0
			,	marginY = 0
			,	proportion = Vaseline.getImageProportions(width,height)
			,	containerProportion = Vaseline.getImageProportions(containerWidth,containerHeight)
			,	p = Vaseline.ImageProportions
			,	i = Vaseline.ImageSizeTypes
			;
			switch(imageSizing){
				case i.COVER:
					switch(containerProportion){
						case p.PORTRAIT:
							switch(proportion){
								case p.LANDSCAPE:
									height = containerHeight;
									width = height*ratio;
								break;
								case p.PORTRAIT:
								case p.SQUARE:
								/* falls through */
								default:
									height = containerHeight;
									width = height/ratio;
								break;
							}
						break;
						case p.LANDSCAPE:
							switch(proportion){
								case p.LANDSCAPE:
									width = containerWidth;
									height = width/ratio;
								break;
								case p.PORTRAIT:
								case p.SQUARE:
								/* falls through */
								default:
									width = containerWidth;
									height = width*ratio;
								break;
							}
						break;
						case p.SQUARE:
						/* falls through */
						default:
							switch(proportion){
								case p.PORTRAIT:
									width = containerWidth;
									height = width*ratio;
								break;
								case p.LANDSCAPE:
								case p.SQUARE:
								/* falls through */
								default:
									height = containerHeight;
									width = height*ratio;
								break;
							}
						break;
					}
				break;
				case i.CONTAIN:
				/* falls through */
				default:
					switch(containerProportion){
						case p.PORTRAIT:
							switch(proportion){
								case p.LANDSCAPE:
									width = containerWidth;
									height = width/ratio;
								break;
								case p.PORTRAIT:
								case p.SQUARE:
								/* falls through */
								default:
									width = containerWidth;
									height = width*ratio;
								break;
							}
						break;
						case p.LANDSCAPE:
							switch(proportion){
								case p.LANDSCAPE:
									height = containerHeight;
									width = height*ratio;
								break;
								case p.PORTRAIT:
								case p.SQUARE:
								/* falls through */
								default:
									height = containerHeight;
									width = height/ratio;
								break;
							}
						break;
						case p.SQUARE:
						/* falls through */
						default:
							switch(proportion){
								case p.PORTRAIT:
									height = containerHeight;
									width = height/ratio;
								break;
								case p.LANDSCAPE:
								case p.SQUARE:
								/* falls through */
								default:
									width = containerWidth;
									height = width/ratio;
								break;
							}
						break;
					}
				break;
			}
			marginY = (containerHeight - height)/2;
			marginX = (containerWidth - width)/2;
			return {x:marginX,y:marginY,width:width,height:height};
		}
		/**
		 * Creates an array from a string representation such as 1..30 or 1...30
		 * @param  {String} str
		 * @return {Array}
		 */
	,	arrayFromString: function VaselineArrayFromString(str){
			str = str.split('.');
			var last = parseInt(str[str.length-1])
			,	first = parseInt(str[0])
			,	arity = str[0].length
			,	exclusive = (str.length > 4) ? 1 : 0
			,	length = last - first - exclusive
			,	arr = []
			,	i
			;
			if(length<0){
				lengh = Math.abs(length);
				for(i = length;i>=0;i--){
					arr.push(Vaseline.pad(first+i,arity));
				}				
			}else{			
				for(i = 0; i<=length;i++){
					arr.push(Vaseline.pad(first+i,arity));
				}
			}
			return arr;
		}
		/**
		 * Creates a closure that will be called when an image loads
		 * @param {Vaseline} that the vaseline instance
		 * @param  {String} src the source of the image
		 * @param  {Int} id the id of the slide
		 * @param  {Int} prevId the id of the previous slide
		 * @param  {String} side "left" or "right", depending if the previous slide preceeded
		 * or follows the current image
		 * @param  {String} imageSizing one of "cover" or "contain". If not provided, will
		 * default to the instance default (set with cover() or contain)
		 * @return {Function} the closed callback
		 */
	,	makeImageCallBack: function VaselineMakeImageCallBack(that,src,id,prevId,imageSizing){
			return function VaselineImageCallBack(err,img){
				if(err){return that.throwError("load","There was an error loading %s",[src]);}
				if(!imageSizing){imageSizing = that._imageSizing;}
				that.emit(Events.LOADED,[img]);
				that.imageReady(img);
			};
		}
		/**
		 * Pads a number with zeros as necessary
		 * @param  {Int} n
		 * @param  {Int} width the amount of digits
		 * @param  {String} z the string to join with
		 * @return {String} the padded number as a string
		 */
	,	pad: function pad(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		}
	,	time:0
	,	fps:60
	,	animateTimer:null
	,	animateFrameId:null
	,	fixTs: false
	,	step: function VaselineStep(){
			var i = 0
			,	l = vaselineInstances.length
			;
			while(i<l){
				vaselineInstances[i++].step();
			}
		}
	,	start: function(){
			Vaseline.animateTimer = setTimeout(
				function(){
					Vaseline.step();
					Vaseline.animateFrameId = requestAnimationFrame(Vaseline.render);
					Vaseline.start();
				}
			,	1000/Vaseline.fps
			);
		}
	,	stop: function(){
			clearTimeout(Vaseline.animateTimer);
			cancelAnimationFrame(Vaseline.animateFrameId);
		}
	,	render: function VaselineRender(){
			var now = new Date().getTime()
			,	dt = now - (Vaseline.time || now)
			,	l = vaselineInstances.length
			,	i = 0
			;
			Vaseline.time = now;
			while(i<l){
				vaselineInstances[i++].render(dt);
			}
		}
	};

	/*/////////////////////////////////////////////////////////

		VASELINE INSTANCE PROPERTIES

	/////////////////////////////////////////////////////////*/

	var VaselineInstanceProperties = {
		_container : null
	,	_slides : []
	,	_canvas : null
	,	_images : []
	,	_buffer : 3
	,	_suffix : ''
	,	_prefix : ''
	,	_currentSlideId : -1
	,	_context : null
	,	_id : 0
	,	_imageSizing : 'contain'
	,	_emitter:false
	,	_resolution:1
	,	_direction:1
	,	_state:'stopped'
	,	_speed:1
	,	_shiftX:0
	,	_currentDrawingOffset:0
	};


	/*/////////////////////////////////////////////////////////

		VASELINE INSTANCE METHODS

	/////////////////////////////////////////////////////////*/

	var VaselineMethods = {
		step:function VaselineInstanceStep(){
			this._shiftX+=(this._speed*this._direction);
		}
	,	render:function VaselineInstanceRender(dt){
			this.drawThreeImages();
		}
		/**
		 * Sets the resolution of the canvas. Can be useful on devices where you want a lower resolution.
		 * 1 is default, and lower values are lower resolutions. You can set resolutions higher than 1,
		 * although it will serve no practical purpose.
		 * Don't forget to call "resize" after this if you changed it at runtime.
		 * @param  {Float} res the resolution, defaults to 1.
		 * @return {Float|Vaseline} the resolution, or the Vaseline object for chaining
		 */
	,	resolution: function VaselineResolution(res){
			if(arguments.length){this._resolution = res; return this;}
			return this._resolution;
		}
		/**
		 * Sets Emitter to "on". If this is on, will emit events
		 * @param  {Boolean} state Emitter state
		 * @return {Boolean|Vaseline} the Emitter state, or the Vaseline object for chaining
		 */
	,	emitter:function VaselineTriggerEventEmitter(state){
			if(arguments.length){this._emitter = state;return this;}
			return this._emitter;
		}
		/**
		 * Sets the images sizing mode to "cover": they will fill their container
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	cover:function VaselineImageSizingCover(){
			this._imageSizing = Vaseline.ImageSizeTypes.COVER;
			return this;
		}
		/**
		 * Sets the images sizing mode to "contain" (default): they will fit in their container
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	contain:function VaselineImageSizingContain(){
			this._imageSizing = Vaseline.ImageSizeTypes.CONTAIN;
			return this;
		}
		/**
		 * Throws an error if Vaseline.debug is set to true. Used internally
		 * @param  {String} func the function name
		 * @param  {String} msg the error message
		 * @param  {Array} replace an array of replacements
		 * @return {undefined}
		 */
	,	throwError:function VaselineThrowError(func,msg,replace){
			if(Vaseline.debug || this._emitter){
				msg = msg.replace(/%s/g,function(match){
					return replace && replace.length ? replace.shift() : '';
				});
				if(Vaseline.debug){
					throw new Error("Vaseline #"+this._id+" Error ["+func+"]: "+msg);
				}
				if(this._emitter){
					this.emit(Events.ERROR,[msg]);
				}
			}
			return this;
		}
		/**
		 * Creates a canvas element if it does not exist
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	canvas:function VaselineCanvas(){
			if(!this._canvas){
				this._canvas = document.createElement('canvas');
				this._canvas.id = Vaseline.makeCanvasId(this._id);
				this._context = this._canvas.getContext('2d');
			}
			return this._canvas;
		}
		/**
		 * Returns the canvas id, or null if no canvas has been set
		 * @return {Int|Null}
		 */
	,	getCanvasId:function VaselineGetCanvasId(){
			if(this._canvas){return this._canvas.id;}
			return null;
		}
		/**
		 * Appends the canvas object to a parent element
		 * @param  {string|node} parentElement a dom node, or an html id
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	appendTo:function VaselineAppendTo(parentElement){
			if(typeof parentElement == 'string'){
				var el = document.getElementById(parentElement);
				if(!el){return this.throwError("appendTo","%s is not a valid dom element",[parentElement]);}
				parentElement = el;
			}
			if(!Vaseline.isDomElement(parentElement)){return this.throwError("appendTo","%s is not a valid dom element",[parentElement]);}
			this._container = parentElement;
			parentElement.appendChild(this.canvas());
			this.emit(Events.READY,[this._canvas]);
			return this;
		}
		/**
		 * Call this when you need to resize the slider. If no values are set,
		 * Vaseline will attempt to resize the canvas to match it's container
		 * @param  {node|int} width either width & height, or an element to conform to
		 * @param  {int} height
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	resize:function VaselineResize(width,height){
			var parentElement;
			if(width && isDomElement(width)){
				parentElement = width;
				width = null;
			}
			if(!width || !height){
				if(this._container){
					parentElement = this._container;
				}
				if(parentElement){
					width = parentElement.clientWidth;
					height = parentElement.clientHeight;
				}
				else{return this.throwError("resize","no valid width and height and no parent element to infer values from");}
			}
			var res = this._resolution || 1;
			this._canvas.width = width * res;
			this._canvas.height = height * res;
			this._canvas.style.width = width+'px';
			this._canvas.style.height = height+'px';
			for(var i=0, l = this._slides.length;i<l;i++){
				this._slides[i].cleanResize();
			}
			this.emit(Events.RESIZED);
			return this;
		}
		/**
		 * Whatever gets passed here gets appended to every item set in slides()
		 * Useful if all your images are .jpg and you want to avoid the repetition
		 * @param  {String} suffix
		 * @return {String|Vaseline} either the suffix, or the Vaseline object for chaining
		 */
	,	suffix:function VaselineSuffix(suffix){
			if(!arguments.length){return this._suffix;}
			this._suffix = suffix;
			return this;
		}
		/**
		 * Whatever gets passed here gets prepended to every item set in slides()
		 * Useful if all your images are in /images and you want to avoid the repetition
		 * @param  {String} prefix
		 * @return {String|Vaseline} either the prefix, or the Vaseline object for chaining
		 */
		, prefix:function VaselinePrefix(prefix){
			if(!arguments.length){return this._prefix;}
			this._prefix = prefix;
			return this;
		}
		/**
		 * Sets slides. Each time this function is called, slides are added to
		 * the previous batch. If you want to edit the array, call slides() without
		 * arguments and edit the resulting array.
		 * If you want to empty the slides array, pass `false` as your argument.
		 * If you pass a string of two number like so: `01..30`, it will create the array for you
		 * @param  {String|Array|Boolean} slides either `false`, or an array of images paths
		 * @return {Array|Vaseline} the slides array or the Vaseline object for chaining
		 */
	,	slides:function VaselineSlides(slides){
			if(!arguments.length){return this._slides;}
			if(slides===false){this._slides=[];return this;}
			if(slides.match(/\d+\.\.\d+/)){
				slides = Vaseline.arrayFromString(slides);
			}
			for(var i=0,l=slides.length;i<l;i++){
				this._slides.push(VaselineImage(this,this._prefix+slides[i]+this._suffix));
			}
			return this;
		}
		/**
		 * Displays the image number defined by the id, loads it if necessary.
		 * @param  {Int} id
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	goTo:function VaselineGoTo(id){
			if(id<0 || id>=this._slides.length){
				return this.throwError("goTo","index %s is not a valid index, there are only %s slides",[id,this._slides.length]);
			}
			var slide = this._slides[id];
			if(!slide){
				return this.throwError("goTo","index %s is not a valid slide, expected [String], found %s",[id,slide]);
			}
			if(this._currentSlideId == id){return this;}
			this._currentSlideId = id;
			this._nextSlideId = false;
			this._previousSlideId = false;
			this._direction = ( this._current - this._previous > 1 )?1:-1;
			this.emit(Events.DISPLAYED,[slide,id,this._previous]);
			this.load(slide,Vaseline.makeImageCallBack(this,slide,id,this._previous));
			return this;
		}
		/**
		 * This is called when an image is ready. Replace it by your own function to trigger
		 * special functionality.
		 * @param  {VaselineImage} img the ready VaselineImage object
		 * @return {Vaseline}     the Vaseline object for chaining
		 */
	,	imageReady: function VaselineImageReady(img){
			//this.draw(img);
			return this;
		}
	,	drawThreeImages: function(){
			var currentSlide = this.current();
			var nextSlide = this.getNextSlide();
			var previousSlide = this.getPreviousSlide();
			var width = this._canvas.width;
			if(currentSlide){
				if(!currentSlide.loaded()){
					currentSlide.load();
				}else{
					this.draw(currentSlide);
				}
				
			}
			if(nextSlide){
				if(!nextSlide.loaded()){
					nextSlide.load();
				}else{
					nextSlide.resize(this._imageSizing);
					nextSlide.position.x += width;
					this.draw(nextSlide);
				}
			}
			if(previousSlide){
				if(!previousSlide.loaded()){
					previousSlide.load();
				}else{
					previousSlide.resize(this._imageSizing);
					previousSlide.position.x -=width;
					this.load(previousSlide);
				}
			}
		}
		/**
		 * Draws an image at the given proportions & offset
		 * @param  {VaselineImage} img
		 * @param  {Object} position object with signature `{}`
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	draw:function VaselineDraw(slide){
			var width,height,img,x;
			var position = slide.position();
			width = this._canvas.width;
			height = this._canvas.height;
			/**
			if(
				!position
			||	(position.x+this._shiftX > width || position.y+this._shiftY > height)
			||	(position.x+position.width < 0 || position.y+position.height < 0)
			){
				return this;
			}
			**/
			//console.log(slide.src(),position.x+this._shiftX)
			img = slide.img();
			this._context.drawImage(
				img
			,	position.x+this._shiftX || 0
			,	position.y+this._shiftY || 0
			,	position.width || width
			,	position.height || height
			);
			this.emit(Events.DRAWN,[img]);
			return this;
		}
		/**
		 * Returns the current slide id
		 * @return {Int}
		 */
	,	currentSlideId:function VaselineCurrentSlideId(){
			return this._currentSlideId;
		}
		/**
		 * Returns the current slide
		 * @return {VaselineImage} the slide
		 */
	,	current: function(){
			return this._slides[this._currentSlideId];
		}
		/**
		 * Convenience function to go to the first image
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	startLoading:function VaselineStart(){
			return this.goTo(0);
		}
		/**
		 * Returns the total number of slides
		 * @return {int}
		 */
	,	length:function VaselineLength(){
			return this._slides.length;
		}
		/**
		 * Displays the next image
		 * @param  {boolean}   loop if true, will wrap to the first image
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	next:function VaselineNext(loop){
			var next = this.getNextSlideId(loop);
			return (next>=0) ? this.goTo(next) : this;
		}
		/**
		 * Returns the next available slide
		 * @param  {boolean}   loop if true, will wrap to the first image
		 * @return {VaselineImage|Boolean} the next slide, or false
		 */
	,	getNextSlide:function VaselineGetNextSlide(loop){
			var slideId = this.getNextSlideId(loop);
			if(slideId>=0){return this._slides[slideId];}
			return false;
		}
		/**
		 * Returns the next available slide
		 * @param  {boolean}   loop if true, will wrap to the first image
		 * @return {int} the next slide id, or -1 if no slide is found
		 */
	,	getNextSlideId:function VaselineGetNextSlideId(loop){
			var next = this._currentSlideId+1;
			if(next >= this._slides.length){
				if(loop){return 0;}
				else{return -1;}
			}
			return next;
		}
		/**
		 * Displays the previous image
		 * @param  {boolean} loop if true, will wrap to the last image
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	previous:function VaselinePrevious(loop){
			var prev = this.getPreviousSlideId(loop);
			return (prev>=0)? this.goTo(prev) : this;
		}
		/**
		 * Returns the previous available slide
		 * @param  {boolean}   loop if true, will wrap to the last image
		 * @return {VaselineImage|Boolean} the previous slide, or false 
		 */
	,	getPreviousSlide:function VaselineGetPreviousSlide(loop){
			var slideId = this.getPreviousSlideId(loop);
			if(slideId>=0){return this._slides[slideId];}
			return 0;
		}
		/**
		 * Returns the previous available slide Id
		 * @param  {boolean}   loop if true, will wrap to the last image
		 * @return {int} the previous slide id, or -1 if no slide is found
		 */
	,	getPreviousSlideId:function VaselineGetPreviousSlideId(loop){
			var next = this._currentSlideId-1;
			if(next<0){
				if(loop){return this._slides.length-1;}
				else{return -1;}
			}
			return next;			
		}
		/**
		 * Loads an image. If the image is already loaded, `callback` is called immediatly
		 * @param {string} src the image path
		 * @param  {Function} callback function to call when the image is loaded
		 * it will have a signature of function(err,img)
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	load:function VaselineLoad(slide,callback){
			slide.callback(callback);
			this.emit(Events.LOAD_START,[slide]);
			slide.load();
			return this;
		}
		/**
		 * Gets an image from the loaded images buffer
		 * @param  {src} src
		 * @return {int} the index of the image, or -1 if no image is found
		 */
	,	findImage:function VaselineFindImage(src){
			var i=0
			,	l=this._slides.length
			,	img
			;
			for(i=0;i<l;i++){
				img=this._slides[i];
				if(img.src()==src){return i;}
			}
			return -1;
		}
		/**
		 * Unloads an image. This means it removes it from the cache,
		 * but it's up to the browser Garbage collector to actually unload the image.
		 * @param {string} src the image path
		 * @return {Vaseline} the Vaseline object for chaining
		 */
	,	unload:function VaselineUnload(src){
			var index = this.findImage(src);
			if(index>=0){
				this._images[index].free();
			}
			return this;
		}
		/**
		 * Sets the maximum number of images to be loaded at any one time.
		 * Bear in mind that this is a tentative number as the browser will remove
		 * images when the garbage collector kicks in.
		 * @param  {int} buffer
		 * @return {int|Vaseline} the buffer size or the Vaseline object for chaining
		 */
	,	buffer:function VaselineBuffer(buffer){
			if(!arguments.length){return this._buffer;}
			this._buffer = buffer;
			return this;
		}
	};

	/*/////////////////////////////////////////////////////////

		VASELINE CLASS & CONSTRUCTOR

	/////////////////////////////////////////////////////////*/

	/**
	 * Instantiates a Vaseline slider. Call with `new` or without.
	 * @param {String|Node} parentElement an element to attach to,
	 * either a node or an element id
	 */
	function Vaseline(parentElement){
		if(!(this instanceof Vaseline)){return new Vaseline(parentElement);}
		extend(this,VaselineInstanceProperties);
		this._id = vaselineInstances.push(this);
		
		if(parentElement){this.appendTo(parentElement);}
	}

	extend(Vaseline,VaselineStaticProperties);
	extend(Vaseline.prototype,VaselineMethods);
	extend(Vaseline.prototype,EventEmitter);
	(function(){
		var makeFunc = function(name){
			return function(fn){
				return this.on(name,fn);
			};
		};
		for(var n in Events){
			Vaseline.prototype['on'+Events[n][0].toUpperCase()+Events[n].substr(1)] = makeFunc(Events[n]);
		}
	})();

	/*/////////////////////////////////////////////////////////

		VASELINEIMAGE INSTANCE PROPERTIES

	/////////////////////////////////////////////////////////*/

	var VaselineImageInstanceProperties = {
		_src: ''
	,	_img: null
	,	hasError: false
	,	_loaded: false
	,	_callback:null
	,	_vaseline:null
	,	height:0
	,	width:0
	,	_position:null
	};

	/*/////////////////////////////////////////////////////////

		VASELINEIMAGE INSTANCE METHODS

	/////////////////////////////////////////////////////////*/

	var VaselineImageMethods = {
		src:function(src){
			if(arguments.length){this._src = src; return this;}
			return this._src;
		}
	,	img:function(){
			return this._img;
		}
	,	parent:function(parent){
			if(arguments.length){this._vaseline = parent; return this;}
			return this._vaseline;
		}
	,	loaded:function(){
			return this._loaded;
		}
	,	load: function VaselineImageLoad(){
			if(this.loaded()){
				return this.onLoad();
			}
			else if(this.hasError){
				return this.onError();
			}
			var img = new Image();
			var that = this;
			img.onerror = function(err){that.onError(err);};
			img.onload = function(){that.onLoad();};
			this._img = img;
			img.src = this._src;
			return this;
		}		
	,	onError: function(err){
			this.free();
			if(this._callback){
				this._callback.call(this._vaseline,err,null);
			}
			return this;
		}
	,	onLoad: function(){
			if(this._img){
				var img = this._img;
				if ('naturalHeight' in img) {
					if (img.naturalHeight + img.naturalWidth === 0) {
						this.onError();
						return;
					}
				} else if (img.width + img.height === 0) {
					img.onError();
					return;
				}
				this._loaded = true;
				this.height = img.naturalHeight || img.height;
				this.width = img.naturalWidth || img.width;
				if(this._callback){
					this._callback.call(this._vaseline,null,this);
				}
			}
			return this;
		}
	,	callback:function(fn){
			if(arguments.length){this._callback = fn; return this;}
			return this._callback;
		}
		/**
		 * Removes event handlers from an image, making it available for
		 * garbage collection
		 * @param {Node} image the image
		 * @return {Node} the image is returned for further processing
		 */
	,	free: function VaselineImageFree(){
			if(this._img){
				this._img.onload = null;
				this._img.onerror = null;
				this._img = null;
				this._loaded = false;
				this.width = 0;
				this.height = 0;
			}
			return this;
		}
	,	resize: function VaselineImageResize(imageSizing){
			if(!this.loaded()){return false;}
			if(this._position){return this;}
			container = this._vaseline._canvas;
			if(!container){return false;}
			imageSizing = (imageSizing == Vaseline.ImageSizeTypes.COVER) ? Vaseline.ImageSizeTypes.COVER : Vaseline.ImageSizeTypes.CONTAIN;
			this._position = Vaseline.calculateImageSize(this._img,container,imageSizing);
			return this;
		}
	,	cleanResize: function(){
			this._position = null;
			return this;
		}
	,	position:function VaselineImagePosition(){
			if(!this._position){this.resize();}
			return this._position;
		}
	};


	/*/////////////////////////////////////////////////////////

		VASELINEIMAGE CLASS & CONSTRUCTOR

	/////////////////////////////////////////////////////////*/


	function VaselineImage(_vaseline,src){
		if(!(this instanceof VaselineImage)){return new VaselineImage(_vaseline,src);}
		extend(this,VaselineImageInstanceProperties);
		if(src){this._src = src;}
		if(_vaseline){this._vaseline = _vaseline;}
	}

	extend(VaselineImage.prototype,VaselineImageMethods);

	/*/////////////////////////////////////////////////////////

		EOF VASELINE

	/////////////////////////////////////////////////////////*/

	return Vaseline;

}));
