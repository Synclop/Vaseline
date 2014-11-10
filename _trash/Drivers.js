var VaselineDriver = (function(){

	var VaselineDriverProperties = {
		_wrapper: null
	,	_container: null
	,	_displays: []
	,	_current: 0
	};

	var VaselineDriverMethods = {

		setUp:function(){
			if(!this._isSetUp){
				if(!this._wrapper){
					throw new Error('no wrapper defined');
				}
				this._container = document.createElement('div');
				this._container.setAttribute('style','overflow:hidden;position:relative');
				if(supportsTransforms){
					this._container.setAttribute('class','vaseline-container supportsTransforms');
				}else{
					this._container.setAttribute('class','vaseline-container');
				}
				this._displays[0] = this.makeDisplay();
				this._displays[1] = this.makeDisplay();
				this._container.appendChild(this._displays[0]);
				this._container.appendChild(this._displays[1]);
				this._wrapper.appendChild(this._container);
				this._isSetUp = true;
			}
			return this;
		}
	,	makeDisplay:function(){
			var display = document.createElement('div');
			display.setAttribute('style','position:absolute;overflow:hidden;width:100%;height:100%;top:0;');
			return display;
		}
	,	resize:function(res){
			if(!this._isSetUp){return this;}
			res = res || 1;
			var w = this._wrapper;
			var c = this._container;
			var width = w.clientWidth;
			var height = w.clientHeight;
			c.style.width = width+'px';
			c.style.height = height+'px';
			for(var i=0,l=this._displays.length;i<l;i++){
				var display = this._displays[i];
				display.width = width * res;
				display.height = height * res;
				display.style.width = width+'px';
				display.style.height = height+'px';
			}
		}
	,	draw:function(slide,position){
			var display = this._displays[position];
			if(!display){throw new Error('no display '+position);}
			var img = slide.img();
			if(!img){throw new Error('slide '+slide.src+' does not have an image loaded');}
			var p = slide.position(display);
			img.setAttribute('style','position:absolute;top:'+p.y+'px;left:'+p.x+'px;width:'+p.width+'px;height:'+p.height+'px;');
			while(display.firstChild) {
				display.removeChild(display.firstChild);
			}
			display.appendChild(img);
			return this;
		}
	,	show: function(direction){
			direction = direction? ' '+direction : '';
			var curr = this._current;
			var next = curr === 0? 1: 0;
			var displayShow = this._displays[next];
			var displayHide = this._displays[curr];
			displayShow.className = 'active'+direction;
			displayHide.className = 'inactive'+direction;
			return this;
		}
	,	wrapper:function(parentElement){
			if(!arguments.length){return this._wrapper;}
			if(typeof parentElement == 'string'){
				var el = document.getElementById(parentElement);
				if(!el){throw new Error(parentElement+' is not a valid parent element');}
				parentElement = el;
			}
			if(!isDomElement(parentElement)){throw new Error(parentElement+' is not a valid parent element');}
			this._wrapper = parentElement;
		}
	};

	if(supportsCanvas){
		var VaselineCanvasDriverMethods = {
			makeDisplay:function(left){
				var display = document.createElement('canvas');
				display.setAttribute('style','position:absolute;overflow:hidden;width:100%;height:100%;top:0;left:'+left);
				return display;
			}
		,	draw:function(slide,position){
				var display = this._displays[position];
				if(!display){throw new Error('no display '+position);}
				var img = slide.img();
				if(!img){throw new Error('slide '+slide.src+' does not have an image loaded');}
				var p = slide.position(display);
				var context = display.getContext('2d');
				context.clearRect(0, 0, display.width, display.height);
				context.drawImage(img,p.x,p.y,p.width,p.height);
				return this;
			}
		};

		var VaselineCanvasDriver = function (wrapper){
			if(!(this instanceof VaselineCanvasDriver)){return new VaselineCanvasDriver(wrapper);}
			extend(this,VaselineDriverProperties);
			if(wrapper){this.wrapper(wrapper);}
		};
		extend(VaselineDriverMethods,VaselineCanvasDriverMethods);
		extend(VaselineCanvasDriver.prototype,VaselineDriverMethods);

		return VaselineCanvasDriver;

	}else{

		var VaselineDomDriverMethods = {};

		var VaselineDomDriver = function(wrapper){
			if(!(this instanceof VaselineDomDriver)){return new VaselineDomDriver(wrapper);}
			extend(this,VaselineDriverProperties);
			if(wrapper){this.wrapper(wrapper);}
		};
		extend(VaselineDriverMethods,VaselineDomDriverMethods);
		extend(VaselineDomDriver.prototype,VaselineDriverMethods);

		return VaselineDomDriver;
	}


})();
