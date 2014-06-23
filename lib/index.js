var http = require('http');
(function() {
	function Courier() {

		this.download = function(options, callback){
			var req = http.request(options, function(res){
				console.log('STATUS: ' + res.statusCode);
				console.log('HEADERS: ' + JSON.stringify(res.headers));
				res.setEncoding('utf8');

				var body = '';
				res.on('data', function (chunk) {
					body += chunk;
				});

				res.on('end', function() {
					callback(null, body);
				});

			}).on('error', function(error){
				console.log('Got error ' +  error.message);
				callback(e.message);
			});

			req.end();
		}

		this.usps = function(tracking_number, callback) {
			var tracking_result = {}; // save your result to this object
			var paramContent = '<TrackFieldRequest USERID="461APPLE6863">' +
    											'<TrackID ID="'+ tracking_number + '"></TrackID>' +
													'</TrackFieldRequest>';

			var options = {
			  host: 'production.shippingapis.com',
			  port: 80,
				//path: '/',
			  path: '/ShippingAPITest.dll?API=TrackV2&XML=' + encodeURIComponent(paramContent),
			  method: 'GET'
			};

			this.download(options, callback);

		};

		this.hkpost = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			// do your job here
			return tracking_result;

		};

		this.dpduk = function(tracking_number) {
			var tracking_result = {}; // save your result to this object

			// do your job here
			return tracking_result;

		};
	}

	module.exports = new Courier();
}());
