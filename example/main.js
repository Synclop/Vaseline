var Vaseline = require('../index.js')
window.v = Vaseline('Canvas')
	.prefix('images/')
	.suffix('.jpg')
	.slides('00..18')
	.cover()
	.resolution(1)
	.resize()
	.autoResize()
	.goTo(0)
;
window.changeResolution = function(res){
	res = parseFloat(res);
	if(isNaN(res)){return;}
	v.resolution(res);
	v.redraw();
}