var http = require('http');

'use strict';
fetchData = function(options, data, callback){
  var req = http.request(options, function(res){
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');

    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function() {
      callback(null, body);
    });

  });

  req.on('error', function(error){
    console.log('Got error ' +  error.message);
    callback(error.message);
  });

  if(options.method === 'POST' || options.method === 'PUT'){
    req.write(data);
  }

  req.end();
}

exports.fetchData = fetchData
