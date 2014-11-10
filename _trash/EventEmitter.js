var EventEmitter = {
	on:function(evt,fn){
		if(isFunction(evt)){
			fn = evt;
			evt = '*';
		}
		if(!this._events){this._events = {};}
		if(!this._events[evt]){this._events[evt] = [];}
		this._events[evt].push(fn);
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
		if(!this._events.length){return this;}
		if(!bindTo){bindTo = this;}
		args = (args || []).unshift(evt);
		function dispatch(evts,bindTo){
			var i = 0
			,	l = evts.length
			;
			for(i;i<l;i++){
				fn = evts[evt];
				fn.apply(bindTo,args);
			}		
		}
		var evts,fn;
		if(this._events && this._events[evt]){
			evts = this._events[evt];
			dispatch(evts,bindTo);
		}
		if(this._events && this._events['*']){
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