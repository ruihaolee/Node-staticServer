//静态资源服务器
var http = require('http');
var url = require('url');
var fs = require('fs');
var mime = require('./mime').types;
var path = require('path');
var config = require('./config');

var rootUrl = "C:/Users/24354/Desktop/vueFrame/lastpack";
http.createServer(function (request, response){
    var pathname = url.parse(request.url).pathname;
    if(pathname === '/'){
        pathname += config.Expires.index;
    }
    //防止非法访问。 比如path是 /../server/server.js 会替换成 /server/server.js
    pathname = path.normalize(pathname.replace(/\.\./g, ""));
    var realPath = rootUrl + pathname;

    fs.exists(realPath, function (exists){
        if (!exists) {
            response.writeHead(404, {'Content-Type' : 'text/plain'});
            response.write('this request url ' + realPath + ' not found on this server');
            response.end();
        }
        else{
            //根据请求的资源MIME类型返回相应的Content-Type
            var mimeName = path.extname(realPath);
            mimeName = mimeName ? mimeName.slice(1) : 'unknown';
            var contentType = mime[mimeName] || 'text/plain';
            response.setHeader('Content-Type', contentType); 
            //fs.stat 获得文件最后修改时间
            fs.stat(realPath, function (err, stat){
                var lastModified = stat.mtime.toUTCString();
                response.setHeader('Last-Modified', lastModified);//设置最后修改时间
                var ifModifiedSince = "If-Modified-Since".toLowerCase();

                if (mimeName.match(config.Expires.fileMatch)) {
                    var expires = new Date();
                    expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                    //设置缓存时长，通常浏览器 Cache-Control高于Expires
                    response.setHeader('Cache-Control', "max-age=" + config.Expires.maxAge);
                    response.setHeader('Expires', expires.toUTCString());
                }

                if (request.headers[ifModifiedSince] && request.headers[ifModifiedSince] == lastModified) {
                    response.writeHead(304, 'Not Modified');
                    response.end();
                }
                else{
                    fs.readFile(realPath, 'binary', function (err, file){
                        if (err) {
                            response.writeHead(500, {'Content-Type': 'text/plain'});
                            response.end(err);
                        }
                        else{
                            response.writeHead('200', 'Ok');
                            response.write(file, "binary");
                            response.end();                    
                        }
                    });
                }

            });
        }
    });
    // response.write(pathname);
    // response.end();  
}).listen(8000);