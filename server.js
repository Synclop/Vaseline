var fs = require('fs')
,	stylus = require('stylus')
,	jade = require('jade')
,	http = require('http')
,	nib = require('nib')
,	browserify = require('browserify')
,	html = jade.compileFile(__dirname+'/index.jade')()
,	style = (function(str, path) {
		return stylus(str)
			.set('filename', path)
			.set('compress', true)
			.use(nib())
		;
	})(fs.readFileSync(__dirname+'/main.styl',{encoding:'utf8'}),__dirname+'/main.styl')
,	js = browserify(__dirname+'/main.js',{basedir:__dirname,debug:true}).bundle()
;


http.createServer(function(req, res){
	if (req.url === '/main.js') {
		res.writeHead(200, {'Content-Type': 'application/javascript'});
		js.on('error', console.error);
		js.pipe(res);
	}
	else if(req.url === '/index.html' || req.url === '/' || req.url === ''){
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(html);
	}
	else if(req.url === '/main.css'){
		style.render(function(err,css){
			if(err){
				res.writeHead(500, {'Content-Type': 'text/plain'});
				res.end(err.message);
			}else{
				res.writeHead(200, {'Content-Type': 'text/css'});
				res.end(css);
			}
		});
	}
	else if(req.url.match(/\.jpg$/)){
		var img = fs.readFileSync(__dirname+req.url);
		setTimeout(function(){
			res.writeHead(200, {'Content-Type': 'image/jpeg' });
			res.end(img, 'binary')
		},(Math.random() * (5000 - 300) + 300)); //simulate slow network
	}
	else{
		res.writeHead(404, 'not found');
		res.end('nope');
	}
}).listen(1337,'127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');