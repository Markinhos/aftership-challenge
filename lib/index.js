var http = require('http');
var parseString = require('xml2js').parseString;
var dateFormat = require('dateformat');

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

			});

			req.on('error', function(error){
				console.log('Got error ' +  error.message);
				callback(error.message);
			});

			req.end();
		}

		this.usps = function(tracking_number, callback) {
			var tracking_result = {};
			var user_id = '461APPLE6863';
			var paramContent = '<TrackFieldRequest USERID="' + user_id +'">' +
    											'<TrackID ID="'+ tracking_number + '"></TrackID>' +
													'</TrackFieldRequest>';

			var options = {
			  host: 'production.shippingapis.com',
			  port: 80,
			  path: '/ShippingAPITest.dll?API=TrackV2&XML=' + encodeURIComponent(paramContent),
			  method: 'GET'
			};

			this.download(options, function(err, data){
				if(err) callback(err);
				parseString(data, function(err, result){
					var result_summary = result.TrackResponse.TrackInfo[0].TrackSummary[0];
					var date = dateFormat(new Date(result_summary.EventDate[0] + " " + result_summary.EventTime[0]), "isoDateTime");
					var tracking_summary = {
						country_name : result_summary.EventCountry[0],
						message : result_summary.Event[0],
						checkpoint_time : date
					};
					console.log("EVENT " + JSON.stringify(result));
					tracking_result.checkpoints = [tracking_summary];
					callback(null,tracking_result);
				});
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
