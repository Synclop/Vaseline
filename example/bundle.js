(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Vaseline = require('../index.js')
var Container = document.getElementById('Canvas')
var previousLink = null;
window.v = Vaseline(Container)
	.prefix('images/')
	.suffix('.jpg')
	.slides('00..18')
	.cover()
	.resolution(1)
	.resize()
	.autoResize()
	.onShow(function(evt,slide){
		var linkId = 'link-'+slide.id();
		if(previousLink){previousLink.className='';}
		previousLink = document.getElementById(linkId);
		previousLink.className = 'active';
	})
	.goTo(0)
;
window.changeResolution = function(res){
	res = parseFloat(res);
	if(isNaN(res)){return;}
	v.resolution(res);
	v.redraw();
}

var hammertime = new Hammer(document.getElementById('Wrapper'), {});

hammertime.on('swipeleft',function(evt){
	v.next();
})
hammertime.on('swiperight',function(evt){
	v.previous();
})
hammertime.on('pinchin',function(){
	v.contain();
})
hammertime.on('pinchout',function(){
	v.cover();
})
},{"../index.js":2}],2:[function(require,module,exports){
module.exports = require('./lib');
},{"./lib":3}],3:[function(require,module,exports){
(function(name, definition) {
	if (typeof module != 'undefined'){module.exports = definition();}
	else if (typeof define == 'function' && typeof define.amd == 'object'){define(definition);}
	else{this[name] = definition();}
}('Vaseline',function(){

	var EventEmitter = {
		on:function(evt,fn){
			if(Vaseline.isFunction(evt)){
				fn = evt;
				evt = '*';
			}
			if(!this._events){this._events = {};}
			if(!this._events[evt]){this._events[evt] = [];}
			this._events[evt].push(fn);
			return this;
		}
	,	once:function(evt,fn){
			var that = this;
			var func = function(){
				var args = [];
				for(var i = 0, l = arguments.length;i<l;i++){
					args.push(arguments[i]);
				}
				that.off(evt,func);
				fn.apply(this,args);
			}
			this.on(evt,func);
			return this;
		}
	,	off:function(evt,fn){
			if(this._events && this._events[evt]){
				if(fn){
					var index = this._events.indexOf(fn);
					if(index>=0){
						this._events.splice(index,1);
					}
				}
				else{
					this._events[evt] = [];
				}
			}
			return this;
		}
	,	emit:function(evt,args,bindTo){
			if(!this._events){return this;}
			if(!bindTo){bindTo = this;}
			args = (args || []);
			if(args[0]!=evt){
				args.unshift(evt);
			}
			function dispatch(evts,bindTo){
				var i = 0
				,	l = evts.length
				;
				for(i;i<l;i++){
					fn = evts[i];
					fn.apply(bindTo,args);
				}		
			}
			var evts,fn;
			if(this._events && this._events[evt] && this._events[evt].length){
				evts = this._events[evt];
				dispatch(evts,bindTo);
			}
			if(this._events && this._events['*'] && this._events['*'].length){
				evts = this._events['*'];
				dispatch(evts,bindTo);
			}
			return this;
		}
	,	relayEvent:function(obj,evt){
			var that = this;
			if(obj && obj.on){
				obj.on(evt,function(){
					var bindTo = this;
					var args = [];
					for(var i = 0, l = arguments.length;i<l;i++){
						args.push(arguments[i]);
					}
					var evt = args.shift();
					that.emit(evt,args,bindTo);
				});
			}
		}
	,	removeAllEvents:function(){
			if(this._events){
				this._events = {};
			}
		}
	};

	EventEmitter.trigger = EventEmitter.emmit;
	EventEmitter.addEventListener = EventEmitter.on;
	EventEmitter.removeEventListener = EventEmitter.off;

	function createShortcutEventsHandlers(obj,Events){
		var makeFunc = function(name){
			return function(fn){
				return this.on(name,fn);
			};
		};
		for(var n in Events){
			obj['on'+Events[n][0].toUpperCase()+Events[n].substr(1)] = makeFunc(Events[n]);
		}
	}

	var VaselineEvents = {
		LOAD:'load'
	,	SHOW:'show'
	,	RESIZE:'resize'
	,	START:'start'
	};

	var instances = [];

	var VaselineProperties = {
		_slides: []
	,	_resolution: 1
	,	_wrapper: null
	,	_prefix:''
	,	_suffix:''
	,	_currentSlide:-1
	,	_nextSlide:-1
	,	_previousSlides:[]
	,	_container:null
	,	_displays:[]
	,	_currentDisplay:0
	,	_autoResize:false
	,	_buffer: 3
	,	_id: 0
	,	_sizing:'contain'
	,	_preloadBuffer:2
	,	_preloaded:[]
	};


	var VaselineMethods =  {
		displays:function(){return this._displays;}
	,	container:function(){return this._container;}
	,	comingUp:function(){return this._nextSlide;}
	,	current:function(){return this._currentSlide;}
	,	currentDisplay:function(){return this._currentDisplay;}
	,	init:function(props){
			if(props){
				if(typeof props == 'string' || Vaseline.isDomElement(props)){
					props = {wrapper:props};
				}
				this.setUp(props);
				this._container = document.createElement('div');
				this._container.setAttribute('style','overflow:hidden;position:relative');
				classes = ['vaseline-container'];
				if(Vaseline.transform){
					classes.push('vaseline-supports-transforms');
				}else{
					classes.push('vaseline-no-transforms');
				}
				if(Vaseline.supportsCanvas){
					classes.push('vaseline-supports-canvas');
				}else{
					classes.push('vaseline-no-canvas');
				}
				this._container.className = classes.join(' ');
				this._displays[0] = this.makeDisplay();
				this._displays[1] = this.makeDisplay();
				this._container.appendChild(this._displays[0]);
				this._container.appendChild(this._displays[1]);
				this._wrapper.appendChild(this._container);
			}
			return this;
		}
	,	logLoadedImages:function(){
			var loaded = [];
			var started = []
			this.each(function(){
				if(this.hasLoaded()){
					loaded.push(this.id());
				}else if(this.hasStarted()){
					started.push(this.id());
				}
			});
			console.log(loaded.length+' images loaded: ',loaded,'and '+started.length+' images started but not loaded yet:',started);
		}
	,	resolution: function(res){
			if(!arguments.length){return this._resolution;}
			this._resolution = res;
			this.resize();
			return this;
		}
	,	resize:function(){
			if(!this._wrapper){throw new Error('attempting to resize without setting up a wrapper');}
			res = this._resolution;
			var w = this._wrapper;
			var c = this._container;
			var i,l;
			var width = w.clientWidth;
			var height = w.clientHeight;
			c.style.width = width+'px';
			c.style.height = height+'px';
			for(i=0,l=this._displays.length;i<l;i++){
				var display = this._displays[i];
				display.width = width * res;
				display.height = height * res;
				display.style.width = width+'px';
				display.style.height = height+'px';
			}
			this.each('resetPosition');
			this.emit(Vaseline.Events.RESIZE);
			return this;
		}
	,	autoResize:function(stop){
			Vaseline.autoResize(this.id(),stop);
			return this;
		}
	,	triggerAutoResize:function(){
			this.resize();
			this.redraw();
			return this;
		}
	,	makeDisplay:function(){
			var display = document.createElement('canvas');
			display.setAttribute('style','position:absolute;overflow:hidden;width:100%;height:100%;');
			display.className = 'vaseline-display';
			return display;
		}
	,	setUp:function(props){
			Vaseline.setUp(this,props);
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
	,	slides:function(slides){
			if(!arguments.length){return this._slides;}
			if(slides===false){this._slides=[];return this;}
			if(slides.match(/\d+\.\.\d+/)){
				slides = Vaseline.arrayFromRange(slides);
			}
			for(var i=0,l=slides.length;i<l;i++){
				this._slides.push(this.makeSlide(slides[i],i));
			}
			return this;
		}
	,	makeSlide:function(src,i){
			return VaselineImage(this,{
				src: this._prefix+src+this._suffix
			,	callback: this.whenLoad
			,	id:i
			});
		}
	,	whenLoad:function(err,slide){
			if(slide.id() == this.comingUp()){
				var direction = this.comingUp()>this.current() ? 'forward':'backward';
				this._wrapper.className = this._wrapper.className.replace(/ vaseline-loading/,'');
				this._currentSlide = this._nextSlide;
				this.emit(Vaseline.Events.LOAD,[slide]);
				this.show(slide,direction);
			}
		}
	,	show:function(slide,direction){
			var currentDisplay = this._displays[this._currentDisplay];
			var nextDisplayId = this._currentDisplay===0?1:0;
			direction = direction || 'forward';
			var nextDisplay = this._displays[nextDisplayId];
			this.draw(nextDisplay,slide);
			currentDisplay.className = 'vaseline-display vaseline-inactive vaseline-'+direction;
			nextDisplay.className = 'vaseline-display vaseline-active vaseline-'+direction;
			this._currentDisplay = nextDisplayId;
			this._previousSlides.push(slide.id());
			this.prune();
			this.emit(Vaseline.Events.SHOW,[slide]);
			return this;
		}
	,	cover:function(){
			if(this._sizing=='cover'){return this;}
			this._sizing = 'cover';
			if(this._slides.length){
				this.each('resetPosition');
				this.redraw();
			}
			return this;
		}
	,	contain:function(){
			if(this._sizing=='contain'){return this;}
			this._sizing = 'contain';
			if(this._slides.length){
				this.each('resetPosition');
				this.redraw();
			}
			return this;
		}
	,	switchSizing:function(){
			if(this._sizing=='contain'){
				return this.cover();
			}
			return this.contain();
		}
	,	prune:function(){
			var i = this._previousSlides.length
			,	slide
			,	slideId
			;
			while(this._previousSlides.length>this._buffer){
				slideId = this._previousSlides.shift();
				slide = this._slides[slideId];
				slide.free();
			}
		}
	,	preload:function(slide){
			var id = slide.id()
			,	i = id+1
			,	slideId
			;
			while(this._preloaded.length){
				slideId = this._preloaded.shift();
				if(slideId!=this._currentSlide && slideId!=this._nextSlide){
					this._slides[slideId].free();
				}
			}
			while((this._preloaded.length < this._preloadBuffer) && this._slides[i]){
				this._preloaded.push(this._slides[i++].load().id());
			}
			return this;
		}
	,	draw:function(display,slide){
			var p = slide.position(display,this._sizing);
			var context = display.getContext('2d');
			context.clearRect(0, 0, display.width, display.height);
			context.drawImage(slide.img(),p.x,p.y,p.width,p.height);
			return this;
		}
	,	redraw:function(){
			var display = this._displays[this._currentDisplay];
			var slide = this._slides[this._currentSlide];
			var that = this;
			if(display && slide){
				if(!slide.hasLoaded()){
					slide.once(function(){
						that.draw(display,slide);
					}).load();
				}else{
					that.draw(display,slide);
				}
			}
			return this;
		}
	,	goTo:function(id){
			if(id>this._slides.length || id < 0){
				throw new Error('slide '+id+' not in range');
			}
			var slide = this._slides[id];
			if(id==this._current || id==this._nextSlide){return this;}
			this._nextSlide = id;
			if(!slide.hasLoaded()){
				if(!this._wrapper.className.match(/vaseline-loading/)){
					this._wrapper.className+=' vaseline-loading';
				}
			}
			slide.load();
			if(!slide.hasLoaded()){
				this.emit(Vaseline.Events.START,[slide]);
			}
			this.preload(slide);
			return this;
		}
	,	next:function(loop){
			var nextId = this._currentSlide+1;
			if(this._slides[nextId]){
				this.goTo(nextId);
			}else{
				if(loop){
					this.goTo(0);
				}
			}
			return this;
		}
	,	previous:function(loop){
			var nextId = this._currentSlide-1;
			if(this._slides[nextId]){
				this.goTo(nextId);
			}else{
				if(loop){
					this.goTo(this._slides.length-1);
				}
			}
			return this;
		}
	,	_set_wrapper:function(parentElement){
			if(typeof parentElement == 'string'){
				var el = document.getElementById(parentElement);
				if(!el){throw new Error(parentElement+" is not a valid dom element");}
				parentElement = el;
			}
			if(!Vaseline.isDomElement(parentElement)){throw new Error(parentElement+" is not a valid dom element");}
			this._wrapper = parentElement;
		}
		/**
		 * @method each
		 * Applies a function or a property to every slide
		 * You can pass either function that will be called in the context of the slide
		 * ("this" will be the slide) and will receive the slide number as an argument, e.g.
		 * ```js
		 * each(function(i){console.log(this.src);});
		 * ```
		 * Or with an object, which property will be applied to each slide. For example:
		 * ```js
		 * each({_hasError=false});
		 * ```
		 * Lastly, you can also call it with a string, which is a method name to call 
		 * on every slide. For example:
		 * ```js
		 * each('load');
		 * ```
		 * @param  {Function|Object|String} obj the function to call, the property to set,
		 * or the method name to call.
		 * @return {SlideList}
		 */
	,	each:function(obj){
			var i = 0,n;
			if(this._slides.length){
				var slide = this._slides[i];
				if(typeof obj == 'string'){
					while(slide){
						slide[obj]();
						slide = this._slides[++i];
					}
				}
				else if(Vaseline.isFunction(obj)){
					while(slide){
						obj.call(slide,i);
						slide = this._slides[++i];
					}
				}else{
					while(slide){
						for(n in obj){
							slide[n] = obj[n];
						}
						slide = this._slides[++i];
					}
				}
			}
			return this;
		}
	};

	var hasOwn = Object.prototype.hasOwnProperty;
	var debounce = function(func, wait, immediate) {
		var timeout;
		return function debounced(){
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	var Utils = {
		Events: VaselineEvents
		/**
		 * Is set to true if the browser supports canvas
		 * @type {Boolean}
		 */
	,	supportsCanvas: ('getContext' in document.createElement('canvas'))
	,	transform: (function(){
			var prefixes = ['transform','WebkitTransform','MozTransform','OTransform','msTransform'];
			for(var i = 0, l = prefixes.length; i < l; i++) {
				if(document.createElement('div').style[prefixes[i]] !== undefined) {
					return prefixes[i];
				}
			}
			return false;
		})()
		/**
		 * @method debounce
		 * Returns a function, that, as long as it continues to be invoked, will not
		 * be triggered. The function will be called after it stops being called for
		 * N milliseconds. If `immediate` is passed, trigger the function on the
		 * leading edge, instead of the trailing.
		 * @attribute http://davidwalsh.name/javascript-debounce-function
		 */
	,	debounce: debounce
	,	autoResize:function(instanceId,stop){
			if(!stop){
				instances[instanceId]._autoResize = true;
			}else{
				instances[instanceId]._autoResize = false;
			}
			for(var i=0,l=instances.length;i<l;i++){
				if(instances[i]._autoResize){
					if(!Vaseline._autoResizeStarted){
						Vaseline._autoResizeStarted = true;
						window.addEventListener('resize',Vaseline.onResize);
					}
					return;
				}
			}
			Vaseline._autoResizeStarted = false;
			window.removeEventListener('resize',Vaseline.onResize);
		}
	,	onResize: debounce(function(){
			for(var i=0,l=instances.length;i<l;i++){
				if(instances[i]._autoResize){
					instances[i].triggerAutoResize();
				}
			}
		}, 250)
		/**
		 * Returns the image proportion type
		 * @param  {Int} width
		 * @param  {Int} height
		 * @return {String} "portrait","landscape" or "square"
		 */
	,	getImageProportions: function(width,height){
			return (width == height) ? 'square':(width<height) ? 'portrait':'landscape';
		}
		/**
		 * @method calculateImageSize
		 * Returns an image size proportionally to the given size, that fits in a container
		 * @param  {Int} width the image width
		 * @param  {Int} height the image height
		 * @param  {Int} containerWidth the container width
		 * @param  {Int} containerHeight the container height
		 * @param  {String} imageSizing one of "contain" or "cover"
		 * @return {Object} an object containing `{x:Int,y:Int,width:Int,height:Int,proportion:String}`
		 */
	,	calculateImageSize: function(img,container,imageSizing){
			var containerHeight = container.height
			,	containerWidth = container.width
			,	width = img.width
			,	height = img.height
			,	ratio = (Math.max(width,height) / Math.min(width,height))
			,	marginX = 0
			,	marginY = 0
			,	proportion = Vaseline.getImageProportions(width,height)
			,	containerProportion = Vaseline.getImageProportions(containerWidth,containerHeight)
			;
			switch(imageSizing){
				case 'cover':
					switch(containerProportion){
						case 'portrait':
							switch(proportion){
								case 'landscape':
									height = containerHeight;
									width = height*ratio;
								break;
								case 'portrait':
								case 'square':
								/* falls through */
								default:
									height = containerHeight;
									width = height/ratio;
								break;
							}
						break;
						case 'landscape':
							switch(proportion){
								case 'landscape':
									width = containerWidth;
									height = width/ratio;
									//height = containerHeight;
									//width = height*ratio;
								break;
								case 'portrait':
								case 'square':
								/* falls through */
								default:
									width = containerWidth;
									height = width*ratio;
								break;
							}
						break;
						case 'square':
						/* falls through */
						default:
							switch(proportion){
								case 'portrait':
									width = containerWidth;
									height = width*ratio;
								break;
								case 'landscape':
								case 'square':
								/* falls through */
								default:
									height = containerHeight;
									width = height*ratio;
								break;
							}
						break;
					}
				break;
				case 'contain':
				/* falls through */
				default:
					switch(containerProportion){
						case 'portrait':
							switch(proportion){
								case 'landscape':
									width = containerWidth;
									height = width/ratio;
								break;
								case 'portrait':
								case 'square':
								/* falls through */
								default:
									width = containerWidth;
									height = width*ratio;
								break;
							}
						break;
						case 'landscape':
							switch(proportion){
								case 'landscape':
									height = containerHeight;
									width = height*ratio;
								break;
								case 'portrait':
								case 'square':
								/* falls through */
								default:
									height = containerHeight;
									width = height/ratio;
								break;
							}
						break;
						case 'square':
						/* falls through */
						default:
							switch(proportion){
								case 'portrait':
									height = containerHeight;
									width = height/ratio;
								break;
								case 'landscape':
								case 'square':
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
			return {x:marginX,y:marginY,width:width,height:height,proportion:proportion};
		}
	,	makeGettersSettersFromProps:function(props,methods){
			var n;
			for(n in props){
				if(!(n[0] == '_' && n[1]!=='_')){continue;}
				if(!hasOwn.call(props,n)){continue;}
				var funcName=n.replace(/^_/,'');
				if(hasOwn.call(methods,funcName)){continue;}
				methods[funcName] = Utils.makeChainableGetterSetter(methods,n,funcName);
			}
		}
	,	makeChainableGetterSetter: function(obj,n,funcName){

			var makeFunctionWithSetAndGet = function(funcName,funcSet,funcGet){
					return function(argument){
						if(arguments.length){
							funcSet.call(this,argument);
							return this;
						}
						return funcGet.call(this);
					};
				}
			,	makeFunctionWithSet = function(funcName,n,funcSet){
					return function(argument){
						if(arguments.length){
							funcSet.call(this,argument);
							return this;
						}
						return this[n];
					};
				}
			,	makeFunctionWithGet = function(funcName,n,funcGet){
					return function(argument){
						if(arguments.length){
							this[n] = argument;
							return this;
						}
						return funcGet.call(this);
					};
				}
			,	makeSimpleSetterGetter = function(funcName,n){
					return function(argument){
						if(arguments.length){
							this[n] = argument;
							return this;
						}
						return this[n];
					};
				}
			,	funcSet=null
			,	funcGet=null
			,	func=null
			;
			funcSet = obj['_set'+n];
			funcGet = obj['_get'+n];
			if(funcSet && funcGet){
				func = makeFunctionWithSetAndGet(funcName,funcSet,funcGet);
			}
			else if(funcSet){
				func = makeFunctionWithSet(funcName,n,funcSet);
			}
			else if(funcGet){
				func = makeFunctionWithGet(funcName,n,funcGet);
			}
			else{
				func = makeSimpleSetterGetter(funcName,n);
			}
			return func;
		}
	,	extend:function(obj1,obj2){
			for(var n in obj2){
				if(hasOwn.call(obj2,n)){
					obj1[n] = obj2[n];
				}
			}
			return obj1;
		}
	,	isFunction: function(obj){
			return !!(obj && obj.constructor && obj.call && obj.apply);
		}
	,	setUp: function(obj1,obj2){
			for(var n in obj2){
				if(hasOwn.call(obj2,n) && obj1[n]){
					if(Vaseline.isFunction(obj1[n])){
						obj1[n](obj2[n]);
					}
					else{
						obj1[n] = obj2[n];
					}
				}
			}
			return obj1;
		}
		/**
		 * Test to know if an object is a dom node
		 * @param  {Object}  o
		 * @return {Boolean}
		 */
	,	isDomElement: function(o){
			return (
				typeof HTMLElement === "object" ?
				o instanceof HTMLElement :
				o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
			);
		}
		/**
		 * @method pad
		 * Pads a number with zeros as necessary
		 * @param  {Int} n
		 * @param  {Int} width the amount of digits
		 * @param  {String} z the string to join with
		 * @return {String} the padded number as a string
		 */
	,	pad: function(n, width, z) {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		}
		/**
		 * @method arrayFromRange
		 * Creates an array from a string representation such as 1..30 or 1...30
		 * .. is inclusive
		 * ... is exclusive
		 * @param  {String} str
		 * @return {Array}
		 */
	,	arrayFromRange: function(str){
			str = str.split('.');
			var last = parseInt(str[str.length-1])
			,	first = parseInt(str[0])
			,	arity = str[0].length
			,	exclusive = (str.length > 4) ? true : false
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
	};

	Utils.makeGettersSettersFromProps(VaselineProperties,VaselineMethods);

	function Vaseline(wrapper){
		if(!(this instanceof Vaseline)){return new Vaseline(wrapper);}
		Vaseline.extend(this,VaselineProperties);
		this.init(wrapper);
		this._id = instances.push(this)-1;
	}
	Utils.extend(Vaseline,Utils);
	Vaseline.extend(Vaseline.prototype,VaselineMethods);
	Vaseline.extend(Vaseline.prototype,EventEmitter);
	createShortcutEventsHandlers(Vaseline.prototype,Vaseline.Events);


	var ImageEvents = {
		FREE:'free'
	,	LOAD:'load'
	,	START:'start'
	,	ERROR:'error'
	,	RESIZE:'resize'
	}

	var ImageProperties = {
		_img:null
	,	_src:null
	,	_hasLoaded:false
	,	_hasError:false
	,	_hasStarted:false
	,	_callback:null
	,	_width:0
	,	_height:0
	,	_vaseline:null
	,	_id:0
	,	_sizing:'contain'
	};

	var ImageMethods = {
		img:function(){if(this._img){return this._img;}}
	,	hasLoaded:function(){return this._hasLoaded;}
	,	hasError:function(){return this._hasError;}
	,	hasStarted:function(){return this._hasStarted;}
	,	width:function(){return this._width;}
	,	height:function(){return this._height;}
	,	init:function(vaseline,props){
			if(!vaseline || !(vaseline instanceof Vaseline)){
				throw new Error(vaseline+' is not a valid Vaseline instance');
			}
			if(props){
				if(typeof props == 'string'){
					props = {src:props,vaseline:vaseline};
				}
				if(!props.vaseline){props.vaseline = vaseline;}
				this.setUp(props);
			}else{
				this.vaseline(vaseline);
			}
			return this;
		}
	,	setUp:function(props){
			Vaseline.setUp(this,props);
			return this;
		}
	,	load:function(callback){
			if(!this._src){throw new Error('no source set');}
			if(callback){this.callback(callback);}
			if(this._hasStarted){
				if(this._hasLoaded){
					if(this._callback){
						if(this._hasError){
							this._callback.call(this._vaseline,true,this);
							return this;
						}
						this._callback.call(this._vaseline,false,this);
					}
				}
				return this;
			}
			this._hasStarted = true;
			var that = this;
			var img = new Image();
			img.onerror = function(err){that.whenError(err);};
			img.onload = function(){that.whenLoad();};
			this._img = img;
			img.src = this._src;
			this.emit(VaselineImage.Events.START);
			return this;
		}
	,	free:function(){
			if(this._img){
				this._img.onload = null;
				this._img.onerror = null;
				this._img = null;
				this._hasLoaded = false;
				this._hasStarted = false;
				this._width = 0;
				this._height = 0;
				this.emit(VaselineImage.Events.FREE);
			}
		}
	,	whenError: function(err){
			this.free();
			this._hasError = true;
			if(this._callback){
				this._callback.call(this._vaseline,err||true,this);
			}
			this.emit(VaselineImage.Events.ERROR);
			return this;
		}
	,	whenLoad: function(){
			if(this._img){
				var img = this._img;
				if ('naturalHeight' in img) {
					if (img.naturalHeight + img.naturalWidth === 0) {
						this.whenError();
						return this;
					}
				} else if (img.width + img.height === 0) {
					this.whenError();
					return this;
				}
				this._hasLoaded = true;
				this._height = img.naturalHeight || img.height;
				this._width = img.naturalWidth || img.width;
				if(this._callback){
					this._callback.call(this._vaseline,false,this);
				}
				this.emit(VaselineImage.Events.LOAD);
			}
			return this;
		}
	,	resetPosition:function(){
			this._position = false;
			return this;
		}
	,	position:function(container,sizing){
			if(sizing){this._sizing=sizing;}
			if(container){this._container = container;}
			if(!this._img){
				console.log('no image');
				return false;
			}
			if(!this._position){
				this._position = Vaseline.calculateImageSize(this._img,this._container,this._sizing);
				this.emit(VaselineImage.Events.RESIZE);
			}
			return this._position;
		}
	};

	Vaseline.makeGettersSettersFromProps(ImageProperties,ImageMethods);

	function VaselineImage(vaseline,src){
		if(!(this instanceof VaselineImage)){return new VaselineImage(vaseline,src);}
		Vaseline.extend(this,ImageProperties);
		this.init(vaseline,src);
	}
	VaselineImage.Events = ImageEvents;
	Vaseline.extend(VaselineImage.prototype,ImageMethods);
	Vaseline.extend(VaselineImage.prototype,EventEmitter);
	createShortcutEventsHandlers(VaselineImage.prototype,VaselineImage.Events);
	return Vaseline;

}));
},{}]},{},[1]);
