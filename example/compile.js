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
	})(fs.readFileSync(__dirname+'/main.styl',{encoding:'utf8'}),__dirname+'/main.styl').render(function(err,css){
		if(err){throw err;}
		fs.writeFileSync(__dirname+'/main.css',css,{encoding:'utf8'})
	})
,	js = browserify(__dirname+'/main.js',{basedir:__dirname,debug:false}).bundle().pipe(fs.createWriteStream(__dirname+'/bundle.js'))
;
fs.writeFileSync(__dirname+'/index.html',html.replace('main.js','bundle.js'),{encoding:'utf8'})