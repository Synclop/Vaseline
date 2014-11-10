var hasOwn = Object.prototype.hasOwnProperty;

function extend(obj1,obj2){
	for(var n in obj2){
		if(hasOwn.call(obj2,n)){
			obj1[n] = obj2[n];
		}
	}
	return obj1;
}

function isFunction(obj){
	return !!(obj && obj.constructor && obj.call && obj.apply);
}


function setUp(obj1,obj2){
	for(var n in obj2){
		if(hasOwn.call(obj2,n) && hasOwn.call(obj1,n)){
			if(isFunction(obj1[n])){
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
 * Returns the image proportion type
 * @param  {Int} width
 * @param  {Int} height
 * @return {String} "portrait","landscape" or "square"
 */
function getImageProportions(width,height){
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
function calculateImageSize(img,container,imageSizing){
	var containerHeight = container.height
	,	containerWidth = container.width
	,	width = img.width
	,	height = img.height
	,	ratio = (Math.max(width,height) / Math.min(width,height))
	,	marginX = 0
	,	marginY = 0
	,	proportion = getImageProportions(width,height)
	,	containerProportion = getImageProportions(containerWidth,containerHeight)
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

/**
 * @method pad
 * Pads a number with zeros as necessary
 * @param  {Int} n
 * @param  {Int} width the amount of digits
 * @param  {String} z the string to join with
 * @return {String} the padded number as a string
 */
function pad(n, width, z) {
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
function arrayFromRange(str){
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
			arr.push(pad(first+i,arity));
		}
	}else{
		for(i = 0; i<=length;i++){
			arr.push(pad(first+i,arity));
		}
	}
	return arr;
}

/**
 * Is set to true if the browser supports canvas
 * @type {Boolean}
 */
var supportsCanvas = ('getContext' in document.createElement('canvas'));

var transform = (function() {
	var prefixes = ['transform','WebkitTransform','MozTransform','OTransform','msTransform'];
	for(var i = 0, l = prefixes.length; i < l; i++) {
		if(document.createElement('div').style[prefixes[i]] !== undefined) {
			return prefixes[i];
		}
	}
	return false;
})();

var supportsTransforms = (transform !== false);


/**
 * Test to know if an object is a dom node
 * @param  {Object}  o
 * @return {Boolean}
 */
function isDomElement(o){
	return (
		typeof HTMLElement === "object" ?
		o instanceof HTMLElement :
		o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	);
}