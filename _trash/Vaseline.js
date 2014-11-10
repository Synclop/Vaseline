var VaselineEvents = {
	RESIZED:	'resized'
,	READY:		'ready'
,	LOADED:		'loaded'
,	ERROR:		'error'
,	DRAWN:		'drawn'
,	DISPLAYED:	'displayed'
,	START:		'Start'
};


var VaselineProperties = {
	_driver:null
,	_resolution: 1
,	_suffix:''
,	_prefix:''
,	_slides:null
}


var VaselineMethods = {
	resize:function(){
		this._driver.resize(this._resolution);
		return this;
	}
	/**
	 * Whatever gets passed here gets appended to every item set in slides()
	 * Useful if all your images are .jpg and you want to avoid the repetition
	 * @param  {String} suffix
	 * @return {String|Vaseline} either the suffix, or the Vaseline object for chaining
	 */
,	suffix:function(suffix){
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
	, prefix:function(prefix){
		if(!arguments.length){return this._prefix;}
		this._prefix = prefix;
		return this;
	}
	/**
	 * Sets slides. Each time this function is called, slides are added to
	 * the previous batch. If you want to edit the array, call slides() without
	 * arguments and edit the resulting array.
	 * If you pass a string of two number like so: `01..30`, it will create the array for you
	 * @param  {String|Array} slides an array of images paths or a string range
	 * @return {Vaseline}
	 */
,	slides:function(slides){
		if(slides.match(/\d+\.+\d+/)){
			slides = arrayFromRange(slides);
		}
		for(var i=0,l=slides.length;i<l;i++){
			this.slideList().add(this._prefix+slides[i]+this._suffix);
		}
		return this;
	}
,	slideList:function(){
		if(!this._slides){this._slides = new SlideList();}
		return this._slides;
	}
};

function Vaseline(wrapper){
	if(!(this instanceof Vaseline)){return new Vaseline(wrapper);}
	extend(this,VaselineProperties);
	this._driver = new VaselineDriver(wrapper);
	this._resolution = 1;
	this._driver.setUp();

}

extend(Vaseline.prototype,VaselineMethods);