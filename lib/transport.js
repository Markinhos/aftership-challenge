var http = require('http');

'use strict';
/*
 * Makes a request to the host and path provided in options
 * @param {Object} Same options as in http node module
 * @param {Object | string} data to be written
 */
fetchData = function(options, data, callback){
  var req = http.request(options, function(res){
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
    callback(error.message);
  });

  if(options.method === 'POST' || options.method === 'PUT'){
    req.write(data);
  }

  req.end();
}

/*
 * Convenience method for making a GET request to an endpoint
 * @param {string}
 */
getData = function(endpoint, callback){
  fetchData(endpoint, null, callback);
}

exports.fetchData = fetchData
exports.getData = getData
