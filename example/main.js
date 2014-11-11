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