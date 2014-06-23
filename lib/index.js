var http = require('http');
(function() {
	function Courier() {

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

			var req = http.get(options, function(res){
			  console.log('STATUS: ' + res.statusCode);
			  console.log('HEADERS: ' + JSON.stringify(res.headers));
			  res.setEncoding('utf8');

				var body = '';
			  res.on('data', function (chunk) {
					body += chunk;
			  });

				// Called when request is complete
				res.on('end', function() {
					console.log("END: " + body);

					//body = JSON.parse(body);

					callback(null, body);
				});

			}).on('error', function(e){
				console.log('Got error ' +  e.message);
				callback(e.message);
			});

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
