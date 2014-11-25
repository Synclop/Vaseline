var Vaseline = require('../index.js')
var Container = document.getElementById('Canvas')
var previousActiveLink = null;
var previousSoonActiveLink = null;
window.v = Vaseline(Container)
	.prefix('images/')
	.suffix('.jpg')
	.cover()
	.resolution(1)
	.resize()
	.autoResize()
	.onShow(function(evt,slide){
		var linkId = 'link-'+slide.id();
		if(previousActiveLink){previousActiveLink.className='';}
		previousActiveLink = document.getElementById(linkId);
		previousActiveLink.className = 'active';
	})
	.onStart(function(evt,slide){
		var linkId = 'link-'+slide.id();
		if(previousSoonActiveLink){previousSoonActiveLink.className='';}
		previousSoonActiveLink = document.getElementById(linkId);
		previousSoonActiveLink.className = 'active-soon';
	})
	.slides('00..18')
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