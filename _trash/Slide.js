var SlideEvents = {
	LOAD:'load'
,	ERROR:'error'
,	START:'start'
};

var SlideProportions = {
	LANDSCAPE:'landscape'
,	PORTRAIT:'portrait'
,	SQUARE:'square'
};

var SlideSizing = {
	COVER:'cover'
,	CONTAIN:'contain'
};

var slideListMethods = {
	/**
	 * @method makeSlide
	 * Creates a slide and binds events to it
	 * @param  {string} src   the source of the slide
	 * @param  {Int} id the id of the slide
	 * @return {Slide}
	 */
	makeSlide:function(src,id){
		var slide = Slide(src,id);
		this.relayEvent(slide,'*');
		return slide;
	}
	/**
	 * @method add
	 * Appends an image to the end of the list. This method traverses
	 * the existing list and places the value at the end in a new item.
	 * @param {String} src the source of the slide
	 * @return {SlideList}
	 */
,	add:function(src){
		var slide = this.makeSlide(src,this._length);
		if(this._length===0){
			this._head = slide;
			this._tail = slide;
			this._current = slide;
		}else{
			this._tail.next = slide;
			slide.previous = this._tail;
			this._tail = slide;
		}
		this._length++;
		return this;
	}
	/**
	 * @method insertAfter
	 * Inserts a slide after the slide at specified index
	 * @param  {Int} index the index after which to insert a slide
	 * @param  {String} src   the source of the slide
	 * @return {SlideList}
	 */
,	insertAfter: function(index,src){
		if(this._length===0 || index>=this._length){
			return this.add(src);
		}
		var s = this.get(index);
		if(s){
			var slide = this.makeSlide(src,index);
			slide.next = s.next;
			s.next.previous = slide;
			s.next = slide;
			slide.previous = s;
			s.propagateNext(function(){this.id+=1;}); 
		}
		return this;
	}
	/**
	 * @method insertBefore
	 * Inserts a slide before the slide at specified index
	 * @param  {Int} index the index before whith to insert a slide
	 * @param  {String} src   the source of the slide
	 * @return {SlideList}
	 */
,	insertBefore:function(index,src){
		if(this._length===0 || index>=this._length){
			return this.add(src);
		}
		var s = this.get(index);
		if(s){
			var slide = this.makeSlide(src,index);
			slide.previous = s.previous;
			s.previous.next = slide;
			s.previous = slide;
			slide.next = s;
			s.propagateNext(function(){this.id+=1;});
		}
		return this;
	}
	/**
	 * @method  get
	 * Retrieves a slide by index or source
	 * @param  {Int|String} search Either the source, or an index
	 * @return {Slide|null} the slide, or null if none was found
	 */
,	get: function(search){
		if(typeof search === 'string'){
			return this.getBySrc(search);
		}
		return this.getById(search);
	}
   /**
     * @method getById
	 * Retrieves a slide at the given position in the list.
	 * @param {int} index The zero-based index of the item whose value 
	 *      should be returned.
	 * @return {Slide} the item
	 */
,	getById: function(index){
		if (index >= 0 && index < this._length){
			var current = this._head
			,	i = 0
			;
			while(i++ < index){
				current = current.next;
			}
			return current;
		} else {
			return null;
		}
	}
	/**
	 * @method getBySrc
	 * Retrieves a slide by source
	 * @param  {String} src the source of the slide to find
	 * @return {Slide}
	 */
,	getBySrc: function(src){
		var current = this._head
		,	i = 0
		,	slide = null
		;
		while(i++ < this._length && !slide){
			if(current._src == src){slide = current;break;}
			current = current.next;
		}
		return slide;
	}
	/**
	 * @method remove
	 * Removes the item from the given location in the list.
	 * @param {Int} index The zero-based index of the item to remove.
	 * @return {Slide}
	 */
,	remove: function(index){
		if (index >=0 && index < this._length){
			var current = this._head
			,	i = 0
			;
			//special case: removing first item
			if (index === 0){
				this._head = current.next;
				if (!this._head){
					this._tail = null;
				} else {
					this._head.prev = null;
				}
				this._head.propagateNext(function(){this.id-=1;});
			} else if (index === this._length -1){
				current = this._tail;
				this._tail = current.prev;
				this._tail.next = null;
			} else {
				while(i++ < index){
					current = current.next;
				}
				current.prev.next = current.next;
				current.next.propagateNext(function(){this.id-=1;});
			}
			this._length--;
			return current;
		} else {
			return null;
		}
	}
   /**
	 * @method size
	 * Returns the number of items in the list.
	 * @return {int} The number of items in the list.
	 */
,	size: function(){
		return this._length;
	}
	/**
	 * @method toArray
	 * Converts the list into an array.
	 * @return {Array} An array containing all the slides
	 */
,	toArray: function(){
		var result = []
		,	current = this._head;
		while(current){
			result.push(current);
			current = current.next;
		}
		return result;
	}
	/**
	 * @method toString
	 * Converts the list into a string representation.
	 * @return {String} A string representation of the list.
	 */
,	toString: function(){
		return this.toArray().toString();
	}
	/**
	 * @method fromArray
	 * Uses an array to create slides
	 * @param  {Array} arr the array of slides; each item should be a source string
	 * @return {SlideList}
	 */
,	fromArray:function(arr){
		for(var i=0, l = arr.length;i<l;i++){
			this.add(arr[i]);
		}
		return this;
	}
	/**
	 * @method each
	 * Applies a function or a property to every slide
	 * You can pass either function that will be called in the context of the slide
	 * ("this" will be the slide) and will receive the slide number as an argument, e.g.
	 * ```js
	 * slideList.each(function(i){console.log(this.src);});
	 * ```
	 * Or with an object, which property will be applied to each slide. For example:
	 * ```js
	 * slideList.each({_hasError=false});
	 * ```
	 * Lastly, you can also call it with a string, which is a method name to call 
	 * on every slide. For example:
	 * ```js
	 * slideList.each('load');
	 * ```
	 * @param  {Function|Object|String} obj the function to call, the property to set,
	 * or the method name to call.
	 * @return {SlideList}
	 */
,	each:function(obj){
		if(this._length){
			var slide, i, n;
			slide = this._head;
			i = 0;
			if(typeof obj == 'string'){
				while(slide){
					slide[obj]();
					slide = slide.next;
				}
			}
			else if(isfunction(obj)){
				while(slide){
					obj.call(slide,i++);
					slide = slide.next;
				}
			}else{
				while(slide){
					for(n in obj){
						slide[n] = obj[n];
					}
					slide = slide.next;
				}
			}
		}
		return this;
	}
	/**
	 * @method filter
	 * Returns a new SliderList with slides clones that pass the
	 * test set in the function
	 * @param  {Function} fn Should return TRUE if the slide is to be included
	 * @return {SliderList}  a filtered list of Slides
	 */
,	filter:function(fn){
		var list = new SlideList();
		if(this._length){
			var slide, i;
			slide = this._head;
			i = 0;
			while(slide){
				if(fn.call(slide,i++)){
					list.add(slide.clone());
				}
				slide = slide.next;
			}
		}
		return list;
	}
	/**
	 * @method reset
	 * Resets iterations
	 * @return {SliderList}
	 */
,	reset:function(){
		if(this._head){
			this._current = this._head;
		}
		return this;
	}
	/**
	 * @method current
	 * returns the current slide
	 * @return {Slide}
	 */
,	current:function(){
		return this._current;
	}
	/**
	 * @method previous
	 * sets the pointer to the previous slide and returns it
	 * @return {Slide}
	 */
,	previous:function(){
		if(this._current){
			this._current = this._current.previous;
		}
		return this.current();
	}
	/**
	 * @method next
	 * sets the pointer to the next slide and returns it
	 * @return {Slide}
	 */
,	next:function(){
		if(this._current){
			this._current = this._current.next;
		}
		return this.current();
	}
};

function SlideList(){
	this._head = null;
	this._tail = null;
	this._current = null;
	this._length = 0;
}

extend(SlideList.prototype,slideListMethods);
extend(SlideList.prototype,EventEmitter);
createShortcutEventsHandlers(SlideList.prototype,SlideEvents);

var imageMethods = {
	onLoad:function(slide){
		return function(){
			var img = this;
			if ('naturalHeight' in img) {
				if (img.naturalHeight + img.naturalWidth === 0) {
					return slide._error('no width and/or height');
				}
			} else if (img.width + img.height === 0) {
				return slide._error('no width and/or height');
			}
			var h = img.naturalHeight || img.height;
			var w = img.naturalWidth || img.width;
			slide._.width = w;
			slide._.height = h;
			slide._.ratio = Math.min(w,h) / Math.max(w,h);
			slide._.proportion = w>h?SlideProportions.LANDSCAPE:h>w?SlideProportions.PORTRAIT:SlideProportions.SQUARE;
			slide._done(img);
		};
	}
,	onError:function(slide){
		return function(err){
			slide.error(err);
		};
	}
};

var slideMethods = {
	clone:function(){
		var s = Slide();
		s._ = this._;
		s._position = this._position;
		return s;
	}
,	src:function(src){
		return this._.src;
	}
,	img:function(){
		return this._.img;
	}
,	width:function(){
		return this._.width;
	}
,	height:function(){
		return this._.height;
	}
,	callback:function(cb){
		if(arguments.length){
			this._callback = cb;
			return this;
		}
		return this._callback;
	}
,	hasLoaded:function(){
		return this._.hasLoaded;
	}
,	hasError:function(){
		return this._.hasError;
	}
,	hasStarted:function(){
		return this._.hasStarted;
	}
,	load:function(cb){
		if(cb){this.callback(cb);}
		if(!this.hasStarted()){
			var img = new Image();
			img.onload = Slide.ImageMethods.onLoad(this);
			img.onerror = Slide.ImageMethods.onError(this);
			this._.img = img;
			img.src = this._src;
			this._.hasStarted = true;
		}else if(this.hasLoaded()){
			if(this._callback){
				this._callback(false,this);
			}
		}else if(this.hasError()){
			if(this._callback){
				this._callback(true,this);
			}
		}
		return this;
	}
,	_error:function(err){
		this.free();
		this._.hasError = true;
		this.emit(SlideEvents.ERROR,[err]);
		if(this._callback){
			this._callback(err,this);
		}
	}
,	_done:function(img){
		this._.hasLoaded = true;
		this.emit(SlideEvents.LOAD,[this]);
		if(this._callback){
			this._callback(false,this);
		}
	}
,	free:function(){
		this._.hasLoaded = false;
		if(this._img){
			this._.img.onload = null;
			this._.img.onerror = null;
			this._.img = null;
		}
		return this;
	}
,	destroy:function(){
		this.removeAllEvents();
		this.free();
	}
,	propagateNext: function(fn,limit,skipMe){
		if(typeof limit == 'undefined' || limit === null || limit === false || limit < 0){limit = Number.POSITIVE_INFINITY;}
		else if(limit===0){return this;}
		if(!skipMe){fn.call(this);}
		if(this.next){
			this.next.propagateNext(fn,limit-1);
		}
		return this;
	}
,	propagatePrevious: function(fn,limit,skipMe){
		if(typeof limit == 'undefined' || limit === null || limit === false || limit < 0){limit = Number.POSITIVE_INFINITY;}
		else if(limit===0){return this;}
		if(!skipMe){fn.call(this);}
		if(this.previous){
			this.previous.propagatePrevious(fn,limit-1);
		}
		return this;
	}
,	propagate: function(fn,limit,skipMe){
		this.propagateNext(fn,limit,skipMe);
		this.propagatePrevious(fn,limit,false);
		return this;
	}
,	resetPosition:function(){
		this._position = false;
		return this;
	}
,	position:function(container){
		if(container){this._container = container;}
		if(!this._position){
			this._position = calculateImageSize(this._,this._container,this._sizing);
		}
		return this._position;

	}
,	sizing:function(imageSizing){
		if(arguments.length){
			this._sizing = imageSizing;
			return this;
		}
		return this._sizing;
	}
};

var makeSlideProperties = function(src){
	return {
		width:0
	,	height:0
	,	src:src
	,	hasError:false
	,	hasLoaded:false
	,	hasStarted:false
	,	img:null
	,	ratio:0
	};
};

var _slides = {};

function Slide(src,id){
	if(!(this instanceof Slide)){
		if(_slides[src]){
			return _slides[src].clone();
		}
		return new Slide(src,id);
	}
	this._ = makeSlideProperties(src);
	this.next = null;
	this.previous = null;
	this.id=id;
	this._callback = null;
	this._position = false;
	this._sizing = SlideSizing.CONTAIN;
	this._container = null;
	if(src){
		_slides[src]=this;
	}
}
Slide.ImageMethods = imageMethods;
extend(Slide.prototype,slideMethods);
extend(Slide.prototype,EventEmitter);
createShortcutEventsHandlers(Slide.prototype,SlideEvents);